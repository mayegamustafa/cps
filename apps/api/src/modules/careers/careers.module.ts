import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  IsDateString,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationStatus, JobStatus, JobType, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { uniqueSlug } from '../../common/slug';

class ApplyDto {
  @IsString() @MinLength(2) firstName: string;
  @IsString() @MinLength(2) lastName: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsString() cvUrl: string;
  @IsOptional() @IsString() coverLetterUrl?: string;
}

class CreateVacancyDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(2) department: string;
  @IsOptional() @IsEnum(JobType) type?: JobType;
  @IsOptional() @IsString() location?: string;
  @IsString() @MinLength(1) description: string;
  @IsOptional() @IsArray() @IsString({ each: true }) requirements?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) responsibilities?: string[];
  @IsOptional() @IsString() salaryRange?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus;
}

class UpdateVacancyDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsEnum(JobType) type?: JobType;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) requirements?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) responsibilities?: string[];
  @IsOptional() @IsString() salaryRange?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus;
}

const HR = [Role.SUPER_ADMIN, Role.HR_ADMIN];

class ReviewDto {
  @IsEnum(ApplicationStatus) status: ApplicationStatus;
  @IsOptional() @IsInt() @Min(0) @Max(100) score?: number;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('careers')
@Controller('careers')
export class CareersController {
  constructor(private prisma: PrismaService) {}

  @Get('vacancies')
  openVacancies() {
    return this.prisma.jobVacancy.findMany({
      where: { status: JobStatus.OPEN, deletedAt: null },
      orderBy: { deadline: 'asc' },
    });
  }

  // Admin: all vacancies (any status). Declared before :slug.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR)
  @Get('vacancies/admin/list')
  adminVacancies() {
    return this.prisma.jobVacancy.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('vacancies/:slug')
  vacancy(@Param('slug') slug: string) {
    return this.prisma.jobVacancy.findUnique({ where: { slug } });
  }

  @Post('vacancies/:id/apply')
  apply(@Param('id') vacancyId: string, @Body() dto: ApplyDto) {
    return this.prisma.jobApplication.create({ data: { vacancyId, ...dto } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR)
  @Post('vacancies')
  createVacancy(@Body() dto: CreateVacancyDto) {
    const { deadline, title, ...rest } = dto;
    return this.prisma.jobVacancy.create({
      data: {
        ...rest,
        title,
        slug: uniqueSlug(title),
        deadline: deadline ? new Date(deadline) : null,
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR)
  @Put('vacancies/:id')
  updateVacancy(@Param('id') id: string, @Body() dto: UpdateVacancyDto) {
    const { deadline, ...rest } = dto;
    return this.prisma.jobVacancy.update({
      where: { id },
      data: { ...rest, ...(deadline ? { deadline: new Date(deadline) } : {}) },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...HR)
  @Delete('vacancies/:id')
  removeVacancy(@Param('id') id: string) {
    return this.prisma.jobVacancy.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  @Get('applications')
  applications() {
    return this.prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vacancy: { select: { title: true } } },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.HR_ADMIN)
  @Patch('applications/:id/review')
  review(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.prisma.jobApplication.update({ where: { id }, data: dto });
  }
}

@Module({ controllers: [CareersController] })
export class CareersModule {}
