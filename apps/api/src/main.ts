import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { AppModule } from './app.module';

/**
 * Apply pending DB migrations at startup, so the schema exists regardless of how
 * the platform starts the container (Dockerfile entrypoint, Nixpacks, or a
 * custom start command). Idempotent and non-fatal — logs and continues so the
 * /api/health and /api/setup endpoints can report problems clearly.
 */
async function runMigrations() {
  try {
    const dbPkg = require.resolve('@cps/database/package.json');
    const dbDir = dirname(dbPkg);
    const schema = join(dbDir, 'prisma', 'schema.prisma');

    // Resolve the Prisma CLI entry directly (no npx, no network). prisma is a
    // dependency of @cps/database, so resolve it from that package's context.
    const prismaPkgPath = require.resolve('prisma/package.json', { paths: [dbDir] });
    const prismaPkg = JSON.parse(readFileSync(prismaPkgPath, 'utf8')) as {
      bin: string | { prisma: string };
    };
    const binRel = typeof prismaPkg.bin === 'string' ? prismaPkg.bin : prismaPkg.bin.prisma;
    const cli = join(dirname(prismaPkgPath), binRel);

    const exec = promisify(execFile);
    const { stdout } = await exec(
      process.execPath,
      [cli, 'migrate', 'deploy', '--schema', schema],
      { env: process.env, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
    );
    // eslint-disable-next-line no-console
    console.log('[migrate] ' + stdout.trim());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[migrate] skipped/failed: ' + (e as Error).message);
  }
}

async function bootstrap() {
  await runMigrations();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('City Parents School API')
    .setDescription('Backend API for the City Parents School platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  // Railway (and most PaaS) inject PORT; fall back to API_PORT for local dev.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API ready on http://localhost:${port}/api`);
}

bootstrap();
