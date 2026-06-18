import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PublishStatus } from '@cps/database';

export class CreateNewsDto {
  @IsString() @MinLength(3)
  slug: string;

  @IsString() @MinLength(3)
  title: string;

  @IsOptional() @IsString()
  excerpt?: string;

  @IsString()
  body: string;

  @IsOptional() @IsString()
  coverImage?: string;

  @IsOptional() @IsEnum(PublishStatus)
  status?: PublishStatus;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];
}

export class UpdateNewsDto extends CreateNewsDto {}
