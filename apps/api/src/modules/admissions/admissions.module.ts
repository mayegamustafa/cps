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
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationStatus, Role, SchoolSection, Residence } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { MailService } from '../mail/mail.module';
import { admissionReceivedEmail, admissionDecisionEmail } from '../mail/templates';

/**
 * The school's paper "New Pupil's Application Form", section for section.
 *
 * Only the fields the office genuinely cannot process an application without
 * are required; every dotted line the paper form treats as fill-if-you-can is
 * optional here too, so a parent is never blocked at 11pm because they cannot
 * remember the mother's employer.
 */
class CreateAdmissionDto {
  @IsString() reference: string;

  // A. Pupil's particulars
  @IsString() @MinLength(2) pupilFirstName: string;
  @IsString() @MinLength(2) pupilLastName: string;
  @IsDateString() pupilDob: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() religion?: string;
  @IsEnum(SchoolSection) section: SchoolSection;
  @IsString() gradeApplyingFor: string;
  @IsOptional() @IsEnum(Residence) residence?: Residence;

  // B(i). Father / guardian
  @IsString() guardianName: string;
  @IsEmail() guardianEmail: string;
  @IsString() guardianPhone: string;
  @IsOptional() @IsString() relationship?: string;
  @IsOptional() @IsString() guardianOccupation?: string;
  @IsOptional() @IsString() guardianWorkplace?: string;
  @IsOptional() @IsString() guardianResidence?: string;
  @IsOptional() @IsString() guardianDistrict?: string;

  // B(ii). Mother
  @IsOptional() @IsString() motherName?: string;
  @IsOptional() @IsString() motherPhone?: string;
  @IsOptional() @IsString() motherEmail?: string;
  @IsOptional() @IsString() motherOccupation?: string;
  @IsOptional() @IsString() motherWorkplace?: string;
  @IsOptional() @IsString() motherResidence?: string;
  @IsOptional() @IsString() motherDistrict?: string;

  // B(iii). Other immediate contact person
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactOccupation?: string;
  @IsOptional() @IsString() contactWorkplace?: string;
  @IsOptional() @IsString() contactResidence?: string;
  @IsOptional() @IsString() contactDistrict?: string;
  @IsOptional() @IsString() contactRelationship?: string;

  // C. Former school
  @IsOptional() @IsString() formerSchool?: string;
  @IsOptional() @IsString() formerClass?: string;
  @IsOptional() @IsString() heardAboutUs?: string;

  // D. Health background
  @IsOptional() @IsString() specialIllness?: string;
  @IsOptional() @IsString() siblingName?: string;
  @IsOptional() @IsString() siblingClass?: string;

  // Declaration
  @IsOptional() @IsString() declarationName?: string;

  @IsOptional() @IsObject() extraData?: Record<string, unknown>;
}

class DecisionDto {
  @IsEnum(ApplicationStatus) status: ApplicationStatus;
  @IsOptional() @IsString() decisionNote?: string;
}

@ApiTags('admissions')
@Controller('admissions')
export class AdmissionsController {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // Public: submit a new application
  @Post()
  async create(@Body() dto: CreateAdmissionDto) {
    const { pupilDob, extraData, ...rest } = dto;
    const application = await this.prisma.admissionApplication.create({
      data: {
        ...rest,
        pupilDob: new Date(pupilDob),
        ...(extraData ? { extraData: extraData as object } : {}),
      },
    });
    // Confirmation email (best-effort; no-op when SMTP is not configured).
    void this.mail.send({
      to: application.guardianEmail,
      subject: `Application received — ${application.reference}`,
      html: admissionReceivedEmail({
        guardian: application.guardianName,
        pupil: `${application.pupilFirstName} ${application.pupilLastName}`,
        reference: application.reference,
      }),
    });
    return application;
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
    const application = await this.prisma.admissionApplication.update({
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
    // Notify the guardian of the decision (best-effort).
    void this.mail.send({
      to: application.guardianEmail,
      subject: `Application update — ${application.reference}`,
      html: admissionDecisionEmail({
        guardian: application.guardianName,
        pupil: `${application.pupilFirstName} ${application.pupilLastName}`,
        reference: application.reference,
        status: dto.status,
        note: dto.decisionNote,
      }),
    });
    return application;
  }
}

@Module({ controllers: [AdmissionsController] })
export class AdmissionsModule {}
