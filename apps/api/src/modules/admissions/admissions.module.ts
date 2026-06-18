import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationStatus, Role, SchoolSection, Residence } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

class CreateAdmissionDto {
  @IsString() reference: string;
  @IsString() @MinLength(2) pupilFirstName: string;
  @IsString() @MinLength(2) pupilLastName: string;
  @IsDateString() pupilDob: string;
  @IsOptional() @IsString() gender?: string;
  @IsEnum(SchoolSection) section: SchoolSection;
  @IsString() gradeApplyingFor: string;
  @IsOptional() @IsEnum(Residence) residence?: Residence;
  @IsString() guardianName: string;
  @IsEmail() guardianEmail: string;
  @IsString() guardianPhone: string;
  @IsOptional() @IsString() relationship?: string;
}

class DecisionDto {
  @IsEnum(ApplicationStatus) status: ApplicationStatus;
  @IsOptional() @IsString() decisionNote?: string;
}

@ApiTags('admissions')
@Controller('admissions')
export class AdmissionsController {
  constructor(private prisma: PrismaService) {}

  // Public: submit a new application
  @Post()
  create(@Body() dto: CreateAdmissionDto) {
    const { pupilDob, ...rest } = dto;
    return this.prisma.admissionApplication.create({
      data: { ...rest, pupilDob: new Date(pupilDob) },
    });
  }

  // Public: track by reference
  @Get('track/:reference')
  track(@Param('reference') reference: string) {
    return this.prisma.admissionApplication.findUnique({
      where: { reference },
      include: { updates: { orderBy: { createdAt: 'desc' } } },
    });
  }

  // Admin: list / review
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMISSIONS_ADMIN)
  @Get()
  list(@Query('status') status?: ApplicationStatus) {
    return this.prisma.admissionApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: approve / reject with an update trail
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMISSIONS_ADMIN)
  @Patch(':id/decision')
  async decide(@Param('id') id: string, @Body() dto: DecisionDto) {
    return this.prisma.admissionApplication.update({
      where: { id },
      data: {
        status: dto.status,
        decisionNote: dto.decisionNote,
        updates: {
          create: {
            status: dto.status,
            message: dto.decisionNote ?? `Status updated to ${dto.status}`,
          },
        },
      },
    });
  }
}

@Module({ controllers: [AdmissionsController] })
export class AdmissionsModule {}
