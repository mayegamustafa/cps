import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PublishStatus, Role } from '@cps/database';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { uniqueSlug } from '../../common/slug';

/** A single field definition stored in Form.fields (free-form JSON). */
type FormField = {
  key: string;
  label: string;
  type: string; // text | textarea | email | phone | number | date | select | checkbox | file
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

class CreateFormDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() fields?: FormField[];
  @IsOptional() @IsString() status?: PublishStatus;
  @IsOptional() @IsString() submitLabel?: string;
  @IsOptional() @IsString() successMessage?: string;
}

class UpdateFormDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() fields?: FormField[];
  @IsOptional() @IsString() status?: PublishStatus;
  @IsOptional() @IsString() submitLabel?: string;
  @IsOptional() @IsString() successMessage?: string;
}

class SubmitDto {
  @IsObject() data: Record<string, unknown>;
}

const EDITORS = [Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR];

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private prisma: PrismaService) {}

  // ── Public: fetch a published form's schema ──
  @Get('public/:slug')
  async publicForm(@Param('slug') slug: string) {
    const form = await this.prisma.form.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      select: { id: true, slug: true, title: true, description: true, fields: true, submitLabel: true, successMessage: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  // ── Public: submit a response ──
  @Post('public/:slug/submit')
  async submit(@Param('slug') slug: string, @Body() dto: SubmitDto) {
    const form = await this.prisma.form.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED },
      select: { id: true, successMessage: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    await this.prisma.formSubmission.create({
      data: { formId: form.id, data: (dto.data ?? {}) as object },
    });
    return { ok: true, message: form.successMessage ?? 'Thank you — your response has been received.' };
  }

  // ── Admin: list, read, manage ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get('admin/list')
  async adminList() {
    const forms = await this.prisma.form.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { submissions: true } } },
    });
    return forms.map((f) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      status: f.status,
      submissions: f._count.submissions,
      fields: f.fields,
      description: f.description,
      submitLabel: f.submitLabel,
      successMessage: f.successMessage,
      createdAt: f.createdAt,
    }));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get(':id')
  async get(@Param('id') id: string) {
    const form = await this.prisma.form.findUnique({ where: { id } });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Get(':id/submissions')
  async submissions(@Param('id') id: string) {
    return this.prisma.formSubmission.findMany({
      where: { formId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Post()
  create(@Body() dto: CreateFormDto) {
    return this.prisma.form.create({
      data: {
        title: dto.title,
        description: dto.description,
        fields: (dto.fields ?? []) as object,
        status: dto.status ?? PublishStatus.DRAFT,
        submitLabel: dto.submitLabel,
        successMessage: dto.successMessage,
        slug: uniqueSlug(dto.title),
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EDITORS)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFormDto) {
    return this.prisma.form.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.fields !== undefined ? { fields: dto.fields as object } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.submitLabel !== undefined ? { submitLabel: dto.submitLabel } : {}),
        ...(dto.successMessage !== undefined ? { successMessage: dto.successMessage } : {}),
      },
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prisma.form.delete({ where: { id } });
  }
}

@Module({ controllers: [FormsController] })
export class FormsModule {}
