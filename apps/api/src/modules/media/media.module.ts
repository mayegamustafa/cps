import {
  Controller,
  Get,
  Module,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';
import { Role } from '@cps/database';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';

type MulterFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  });
}

@ApiTags('media')
@Controller('media')
export class MediaController {
  // Lets the admin UI show "uploads enabled" vs "paste a URL".
  @Get('status')
  status() {
    return { uploadsEnabled: r2Configured() };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR, Role.HR_ADMIN, Role.ADMISSIONS_ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: MulterFile) {
    if (!file) throw new ServiceUnavailableException('No file received.');
    if (!r2Configured()) {
      throw new ServiceUnavailableException(
        'File uploads are not configured. Set R2_* env vars on the API service, or paste an image/file URL instead.',
      );
    }
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-60);
    const key = `uploads/${Date.now()}-${randomBytes(4).toString('hex')}-${safe}`;
    try {
      await r2Client().send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (e) {
      throw new ServiceUnavailableException(`Upload failed: ${(e as Error).message}`);
    }
    const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
    return { url: `${base}/${key}`, key };
  }
}

@Module({ controllers: [MediaController] })
export class MediaModule {}
