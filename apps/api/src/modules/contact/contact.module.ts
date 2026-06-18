import { Module } from '@nestjs/common';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateContactDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() subject?: string;
  @IsString() @MinLength(5) message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private prisma: PrismaService) {}

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
}

@Module({ controllers: [ContactController] })
export class ContactModule {}
