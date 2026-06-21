import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword, hashPassword } from './password.util';
import type { LoginDto } from './dto';
import type { JwtPayload } from './jwt.strategy';
import { MailService } from '../modules/mail/mail.module';
import { emailLayout } from '../modules/mail/templates';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async login(dto: LoginDto, ctx: { ip?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Second factor (TOTP) when enabled
    if (user.twoFactorEnabled) {
      if (!dto.totp) throw new BadRequestException('Two-factor code required');
      const valid =
        !!user.twoFactorSecret &&
        authenticator.verify({ token: dto.totp, secret: user.twoFactorSecret });
      if (!valid) throw new UnauthorizedException('Invalid two-factor code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(
      { sub: user.id, email: user.email, roles: user.roles },
      ctx,
    );
  }

  private async issueTokens(
    payload: JwtPayload,
    ctx: { ip?: string; userAgent?: string },
  ) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
      expiresIn: Number(process.env.JWT_ACCESS_TTL ?? 900),
    });

    const rawRefresh = randomBytes(40).toString('hex');
    const tokenHash = createHash('sha256').update(rawRefresh).digest('hex');
    const ttl = Number(process.env.JWT_REFRESH_TTL ?? 1_209_600);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: payload.sub,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefresh, tokenType: 'Bearer' };
  }

  /**
   * Begin password reset. Always returns success (no account enumeration).
   * In production the token is emailed; with no SMTP configured it is also
   * returned so the flow can be completed and tested.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
    // Email the reset link via SMTP when configured. If SMTP is not set up
    // (and not in production) the raw token is also returned so the flow can
    // still be completed/tested.
    const base = process.env.WEB_ORIGIN ?? process.env.PUBLIC_WEB_URL ?? '';
    const link = `${base}/admin/reset?token=${rawToken}`;
    const result = await this.mail.send({
      to: user.email,
      subject: 'Reset your City Parents School admin password',
      html: emailLayout({
        heading: 'Password reset',
        body: `<p>We received a request to reset your password.</p>
          <p><a href="${link}" style="display:inline-block;background:#6e1f23;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reset password</a></p>
          <p style="color:#8a8a8a;font-size:13px;">Or paste this link: ${link}</p>
          <p style="color:#8a8a8a;font-size:13px;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
      }),
    });
    const devToken =
      result.sent || process.env.NODE_ENV === 'production' ? undefined : rawToken;
    return { ok: true, resetToken: devToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.user.findFirst({
      where: { resetTokenHash: tokenHash, resetTokenExpiresAt: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    // Revoke existing sessions for safety.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(newPassword) },
    });
    return { ok: true };
  }

  /** Provision a new TOTP secret for enabling 2FA. */
  generateTwoFactorSecret(email: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(
      email,
      process.env.TOTP_ISSUER ?? 'City Parents School',
      secret,
    );
    return { secret, otpauth };
  }
}
