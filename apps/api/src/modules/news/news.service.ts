import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishStatus } from '@cps/database';
import { uniqueSlug } from '../../common/slug';
import { sanitizeHtml } from '../../common/sanitize-html';
import type { CreateNewsDto, UpdateNewsDto } from './news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  /** Public list — only published, non-deleted articles. */
  findPublished(take = 12, skip = 0) {
    return this.prisma.newsArticle.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
    });
  }

  /** Admin list — every non-deleted article, any status. */
  findAll() {
    return this.prisma.newsArticle.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: { slug, status: PublishStatus.PUBLISHED, deletedAt: null },
    });
    if (!article) throw new NotFoundException('Article not found');
    await this.prisma.newsArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
    return article;
  }

  create(dto: CreateNewsDto, authorId: string) {
    const status = dto.status ?? PublishStatus.DRAFT;
    return this.prisma.newsArticle.create({
      data: {
        ...dto,
        // The body is HTML from the editor and ends up in a public page, so it
        // is cleaned here rather than trusted because an admin typed it.
        ...(dto.body !== undefined ? { body: sanitizeHtml(dto.body) } : {}),
        slug: dto.slug || uniqueSlug(dto.title),
        status,
        publishedAt: status === PublishStatus.PUBLISHED ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateNewsDto) {
    const current = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Article not found');
    // Set publishedAt the first time it becomes published.
    const publishedAt =
      dto.status === PublishStatus.PUBLISHED && !current.publishedAt
        ? new Date()
        : undefined;
    return this.prisma.newsArticle.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.body !== undefined ? { body: sanitizeHtml(dto.body) } : {}),
        ...(publishedAt ? { publishedAt } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.newsArticle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
