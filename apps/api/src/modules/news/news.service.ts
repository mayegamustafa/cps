import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublishStatus } from '@cps/database';
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
    return this.prisma.newsArticle.create({ data: { ...dto, authorId } });
  }

  update(id: string, dto: UpdateNewsDto) {
    return this.prisma.newsArticle.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.newsArticle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
