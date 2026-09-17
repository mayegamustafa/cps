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
  findPublished(take = 12, skip = 0, tag?: string) {
    return this.prisma.newsArticle.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        deletedAt: null,
        // Tags double as categories, so the public list can be filtered by one.
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
      include: {
        author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  /** Every tag in use on a published article, for the filter row on /news. */
  async publishedTags(): Promise<string[]> {
    const rows = await this.prisma.newsArticle.findMany({
      where: { status: PublishStatus.PUBLISHED, deletedAt: null },
      select: { tags: true },
    });
    const seen = new Map<string, number>();
    for (const row of rows) {
      for (const tag of row.tags) seen.set(tag, (seen.get(tag) ?? 0) + 1);
    }
    // Most-used first, so the row reads as the sections the school actually writes about.
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
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
      include: {
        author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
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
        // The signed-in writer was passed in but never stored, so no article
        // has ever had an author and every byline fell back to the school name.
        authorId,
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
