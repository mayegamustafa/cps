import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationStatus, JobStatus, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class ApplyDto {
  @IsString() @MinLength(2) firstName: string;
  @IsString() @MinLength(2) lastName: string;
  @IsEmail() email: string;
  @IsString() phone: string;
  @IsString() cvUrl: string;
  @IsOptional() @IsString() coverLetterUrl?: string;
}

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
