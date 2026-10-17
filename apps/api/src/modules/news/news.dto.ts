import {
  IsDateString,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PublishStatus } from '@cps/database';

export class CreateNewsDto {
  // Slug is auto-generated from the title when omitted.
  @IsOptional() @IsString()
  slug?: string;

  @IsString() @MinLength(3)
  title: string;

  @IsOptional() @IsString()
  excerpt?: string;

  @IsString() @MinLength(1)
  body: string;

  @IsOptional() @IsString()
  coverImage?: string;

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;

  /** Set explicitly to backdate a piece, or left out to use the moment it was published. */
  @IsOptional() @IsDateString()
  publishedAt?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];
}

export class UpdateNewsDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsEnum(PublishStatus) status?: PublishStatus;
  @IsOptional() @IsDateString() publishedAt?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}
