import { Module } from '@nestjs/common';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { MailService } from '../mail/mail.module';
import { contactReplyEmail } from '../mail/templates';

class CreateContactDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() subject?: string;
  @IsString() @MinLength(5) message: string;
}

class ReplyDto {
  @IsString() @MinLength(2) message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Get()
  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Patch(':id')
  setHandled(@Param('id') id: string, @Body() dto: { handled?: boolean }) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { handled: dto.handled ?? true },
    });
  }

  // Admin: send an email reply and mark the message handled.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Post(':id/reply')
  async reply(@Param('id') id: string, @Body() dto: ReplyDto) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    const result = await this.mail.send({
      to: message.email,
      subject: `Re: ${message.subject || 'Your enquiry'}`,
      html: contactReplyEmail({ name: message.name, original: message.message, reply: dto.message }),
    });
    if (result.sent) {
      await this.prisma.contactMessage.update({ where: { id }, data: { handled: true } });
    }
    return { sent: result.sent, error: result.error };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.contactMessage.delete({ where: { id } });
  }
}

@Module({ controllers: [ContactController] })
export class ContactModule {}
