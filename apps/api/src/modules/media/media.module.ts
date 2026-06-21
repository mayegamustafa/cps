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
import { createHash, randomBytes } from 'node:crypto';
import { Role } from '@cps/database';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles } from '../../auth/roles.decorator';
import { IntegrationsService } from '../integrations/integrations.module';

type MulterFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type CloudinaryCreds = { cloudName: string; apiKey: string; apiSecret: string };

// ── Cloudinary (free media CDN) ──────────────────────────────────────────────
// Credentials come from admin Integrations first, then CLOUDINARY_* env vars.
function cloudinaryFromEnv(): CloudinaryCreds | null {
  // Either three discrete vars, or a single CLOUDINARY_URL = cloudinary://key:secret@cloud.
  if (process.env.CLOUDINARY_URL) {
    const m = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (m) return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) return { cloudName, apiKey, apiSecret };
  return null;
}

async function resolveCloudinary(integrations: IntegrationsService): Promise<CloudinaryCreds | null> {
  const c = (await integrations.get()).media?.cloudinary;
  if (c?.cloudName && c?.apiKey && c?.apiSecret) {
    return { cloudName: c.cloudName, apiKey: c.apiKey, apiSecret: c.apiSecret };
  }
  return cloudinaryFromEnv();
}

async function uploadToCloudinary(creds: CloudinaryCreds, file: MulterFile): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'city-parents';
  // Signed upload: SHA1 of the alphabetically-sorted params + api_secret.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(toSign + creds.apiSecret).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', creds.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  // resource_type 'auto' handles images, video and raw documents (PDF/CV).
  const url = `https://api.cloudinary.com/v1_1/${creds.cloudName}/auto/upload`;
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Cloudinary ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { secure_url?: string; url?: string };
  const out = data.secure_url ?? data.url;
  if (!out) throw new Error('Cloudinary returned no URL');
  return out;
}

// ── Cloudflare R2 (S3-compatible) ────────────────────────────────────────────
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

async function uploadToR2(file: MulterFile): Promise<string> {
  const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-60);
  const key = `uploads/${Date.now()}-${randomBytes(4).toString('hex')}-${safe}`;
  await r2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  return `${base}/${key}`;
}

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private integrations: IntegrationsService) {}

  // Lets the admin UI show "uploads enabled" (and which provider) vs "paste a URL".
  @Get('status')
  async status() {
    const cloudinary = await resolveCloudinary(this.integrations);
    if (cloudinary) return { uploadsEnabled: true, provider: 'cloudinary' };
    if (r2Configured()) return { uploadsEnabled: true, provider: 'r2' };
    return { uploadsEnabled: false, provider: null };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MARKETING_ADMIN, Role.CONTENT_EDITOR, Role.HR_ADMIN, Role.ADMISSIONS_ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: MulterFile) {
    if (!file) throw new ServiceUnavailableException('No file received.');

    const cloudinary = await resolveCloudinary(this.integrations);
    if (cloudinary) {
      try {
        const url = await uploadToCloudinary(cloudinary, file);
        return { url, provider: 'cloudinary' };
      } catch (e) {
        throw new ServiceUnavailableException(`Upload failed: ${(e as Error).message}`);
      }
    }

    if (r2Configured()) {
      try {
        const url = await uploadToR2(file);
        return { url, provider: 'r2' };
      } catch (e) {
        throw new ServiceUnavailableException(`Upload failed: ${(e as Error).message}`);
      }
    }

    throw new ServiceUnavailableException(
      'File uploads are not configured. Add free Cloudinary credentials under Admin → Integrations, or paste an image/file URL instead.',
    );
  }
}

@Module({ controllers: [MediaController] })
export class MediaModule {}
