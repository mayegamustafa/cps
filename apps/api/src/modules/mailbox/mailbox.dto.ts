import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MailThreadState } from '@cps/database';

export class CreateMailboxDto {
  @IsEmail() address: string;
  @IsString() @MinLength(2) @MaxLength(120) displayName: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
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
}

export class ComposeDto {
  @IsString() mailboxId: string;
  @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) to: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsEmail({}, { each: true }) cc?: string[];
  @IsString() @MinLength(1) @MaxLength(300) subject: string;
  @IsString() @MinLength(1) @MaxLength(50_000) body: string;
}
