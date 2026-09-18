import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MailThreadState } from '@cps/database';

/**
 * A file already uploaded through /api/media/upload, attached to an outgoing
 * message by URL.
 *
 * The URL is handed to nodemailer as a `path`, which also accepts local file
 * paths, so the scheme is pinned to https here. Without that, a crafted
 * "file:///etc/passwd" would attach a file off the server.
 */
export class OutgoingAttachmentDto {
  @IsString() @MinLength(1) @MaxLength(250) fileName: string;
  @IsString() @MaxLength(1000) @Matches(/^https:\/\//i, { message: 'Attachments must be https URLs.' })
  url: string;
  @IsOptional() @IsString() @MaxLength(150) mimeType?: string;
  @IsOptional() @IsInt() @Min(0) sizeBytes?: number;
}

export class CreateMailboxDto {
  @IsEmail() address: string;
  @IsString() @MinLength(2) @MaxLength(120) displayName: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @MaxLength(600) avatarUrl?: string;
  @IsOptional() @IsBoolean() isCatchAll?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(2000) signature?: string;
  @IsOptional() @IsBoolean() autoReplyEnabled?: boolean;
  @IsOptional() @IsString() @MaxLength(200) autoReplySubject?: string;
  @IsOptional() @IsString() @MaxLength(4000) autoReplyBody?: string;
}

export class UpdateMailboxDto {
  @IsOptional() @IsEmail() address?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) displayName?: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsOptional() @IsString() @MaxLength(600) avatarUrl?: string;
  @IsOptional() @IsBoolean() isCatchAll?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsString() @MaxLength(2000) signature?: string;
  @IsOptional() @IsBoolean() autoReplyEnabled?: boolean;
  @IsOptional() @IsString() @MaxLength(200) autoReplySubject?: string;
  @IsOptional() @IsString() @MaxLength(4000) autoReplyBody?: string;
}

export class UpdateThreadDto {
  @IsOptional() @IsBoolean() isRead?: boolean;
  @IsOptional() @IsBoolean() isStarred?: boolean;
  @IsOptional() @IsEnum(MailThreadState) state?: MailThreadState;
}

export class AssignThreadDto {
  @IsOptional() @IsString() assignedToId?: string | null;
}

export class ReplyDto {
  @IsString() @MinLength(1) @MaxLength(50_000) body: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) cc?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) bcc?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true })
  @Type(() => OutgoingAttachmentDto)
  attachments?: OutgoingAttachmentDto[];
}

export class ComposeDto {
  @IsString() mailboxId: string;
  @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) to: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) cc?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) bcc?: string[];
  @IsString() @MinLength(1) @MaxLength(300) subject: string;
  @IsString() @MinLength(1) @MaxLength(50_000) body: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true })
  @Type(() => OutgoingAttachmentDto)
  attachments?: OutgoingAttachmentDto[];
}

export class MailboxMemberDto {
  @IsString() userId: string;
  @IsOptional() @IsBoolean() canSend?: boolean;
  @IsOptional() @IsBoolean() canManage?: boolean;
}

export class SetMembersDto {
  @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true })
  @Type(() => MailboxMemberDto)
  members: MailboxMemberDto[];
}
