import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { hashPassword } from '../../auth/password.util';

type AuthedRequest = { user?: { id?: string; email?: string; roles?: Role[] } };

class CreateUserDto {
  @IsEmail() email: string;
  @IsString() @MinLength(1) @MaxLength(80) firstName: string;
  @IsString() @MinLength(1) @MaxLength(80) lastName: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsString() @MinLength(8) @MaxLength(200) password: string;
  @IsOptional() @IsArray() @ArrayMaxSize(9) @IsEnum(Role, { each: true }) roles?: Role[];
}

class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) lastName?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(9) @IsEnum(Role, { each: true }) roles?: Role[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) lastName?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
}

class SetPasswordDto {
  @IsString() @MinLength(8) @MaxLength(200) password: string;
}

/** Never returns passwordHash, reset tokens or 2FA secrets. */
const PUBLIC_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  roles: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  // ── Self service: any signed-in staff member ──────────────────────────────
  // Declared before ':id' so "me" is never read as an id.

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthedRequest) {
    const id = req.user?.id;
    if (!id) throw new ForbiddenException('No session.');
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...PUBLIC_FIELDS, mailboxAccess: { select: { mailboxId: true, canSend: true, canManage: true } } },
    });
    if (!user) throw new NotFoundException('Account not found.');
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateMeDto) {
    const id = req.user?.id;
    if (!id) throw new ForbiddenException('No session.');
    // Deliberately cannot touch roles or isActive: that is an admin action.
    return this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_FIELDS });
  }

  // ── Administration ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get()
  list() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { ...PUBLIC_FIELDS, mailboxAccess: { select: { mailboxId: true } } },
      orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }],
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException(`${email} already has an account.`);
    return this.prisma.user.create({
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone,
        passwordHash: hashPassword(dto.password),
        roles: dto.roles ?? [],
        emailVerified: true,
      },
      select: PUBLIC_FIELDS,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: AuthedRequest) {
    // Locking yourself out, or dropping your own SUPER_ADMIN, would leave the
    // school with no way back in. Refuse rather than let it happen.
    if (id === req.user?.id) {
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account.');
      }
      if (dto.roles && !dto.roles.includes(Role.SUPER_ADMIN)) {
        throw new BadRequestException('You cannot remove your own super admin role.');
      }
    }
    return this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_FIELDS });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/password')
  async setPassword(@Param('id') id: string, @Body() dto: SetPasswordDto) {
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: hashPassword(dto.password),
        // Any outstanding reset link stops working the moment this is set.
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });
    // Existing sessions are cut so a handed-over account cannot keep the old one.
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return { updated: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthedRequest) {
    if (id === req.user?.id) throw new BadRequestException('You cannot delete your own account.');
    const remaining = await this.prisma.user.count({
      where: { deletedAt: null, isActive: true, roles: { has: Role.SUPER_ADMIN }, id: { not: id } },
    });
    if (remaining === 0) {
      throw new BadRequestException('This is the last super admin. Promote someone else first.');
    }
    // Soft delete keeps their name on the mail they sent.
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: id } });
    return { deleted: true };
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
