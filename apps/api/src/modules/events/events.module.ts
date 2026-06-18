import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PublishStatus, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateEventDto {
  @IsString() slug: string;
  @IsString() @MinLength(3) title: string;
  @IsString() description: string;
  @IsDateString() startsAt: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() category?: string;
}

class RegisterDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsInt() @Min(0) guests?: number;
}

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  upcoming() {
    return this.prisma.event.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
    });
  }

  @Post(':id/register')
  register(@Param('id') eventId: string, @Body() dto: RegisterDto) {
    return this.prisma.eventRegistration.create({ data: { eventId, ...dto } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR)
  @Post()
  create(@Body() dto: CreateEventDto) {
    const { startsAt, endsAt, ...rest } = dto;
    return this.prisma.event.create({
      data: {
        ...rest,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
  }
}

@Module({ controllers: [EventsController] })
export class EventsModule {}
