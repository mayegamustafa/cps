import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateAlumniDto {
  @IsString() @MinLength(2) fullName: string;
  @Type(() => Number) @IsInt() @Min(1950) graduationYear: number;
  @IsOptional() @IsString() classOf?: string;
  @IsOptional() @IsString() currentRole?: string;
  @IsOptional() @IsString() organisation?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

class UpdateAlumniDto {
  @IsOptional() @IsString() @MinLength(2) fullName?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1950) graduationYear?: number;
  @IsOptional() @IsString() classOf?: string;
  @IsOptional() @IsString() currentRole?: string;
  @IsOptional() @IsString() organisation?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

const EDITORS = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('alumni')
@Controller('alumni')
export class AlumniController {
  constructor(private prisma: PrismaService) {}

  // Public: the visible alumni directory.
  @Get()
  list() {
    return this.prisma.alumniProfile.findMany({
      where: { isPublic: true },
      orderBy: { graduationYear: 'desc' },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get('admin/list')
  adminList() {
    return this.prisma.alumniProfile.findMany({ orderBy: { graduationYear: 'desc' } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Post()
  create(@Body() dto: CreateAlumniDto) {
    return this.prisma.alumniProfile.create({ data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlumniDto) {
    return this.prisma.alumniProfile.update({ where: { id }, data: dto });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.alumniProfile.delete({ where: { id } });
  }
}

@Module({ controllers: [AlumniController] })
export class AlumniModule {}
