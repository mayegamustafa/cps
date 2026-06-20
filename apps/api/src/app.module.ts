import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './modules/news/news.module';
import { ContactModule } from './modules/contact/contact.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { EventsModule } from './modules/events/events.module';
import { CareersModule } from './modules/careers/careers.module';
import { LiveModule } from './modules/live/live.module';
import { SocialModule } from './modules/social/social.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatsModule } from './modules/stats/stats.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SetupModule } from './modules/setup/setup.module';
import { AlumniModule } from './modules/alumni/alumni.module';
import { GalleryModule } from './modules/gallery/gallery.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    NewsModule,
    ContactModule,
    AdmissionsModule,
    EventsModule,
    CareersModule,
    LiveModule,
    SocialModule,
    DownloadsModule,
    SettingsModule,
    StatsModule,
    AnnouncementsModule,
    SetupModule,
    AlumniModule,
    GalleryModule,
    // Further modules (staff, seo) follow the same controller→Prisma pattern.
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
