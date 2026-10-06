import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ReservationsService } from './reservations.service';
import { parseThemeOverrides } from '../theme/theme.util';

@Controller('public/estabelecimentos')
export class PublicEstablishmentController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.reservationsService.getEstablishmentBySlug(slug);
  }

  @Get(':slug/theme')
  async getTheme(
    @Param('slug') slug: string,
    @Query() query: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const overrides = parseThemeOverrides(query);
    const theme = await this.reservationsService.getThemeBySlug(
      slug,
      overrides,
    );
    const variant = new URLSearchParams(
      Object.entries(overrides) as [string, string][],
    ).toString();
    const etag = `W/"theme-${slug}-${theme.rev}-${variant}"`;
    res.setHeader('ETag', etag);
    // Cache curto no navegador/CDN; a revalidação por ETag é barata (304).
    res.setHeader(
      'Cache-Control',
      'public, max-age=60, stale-while-revalidate=300',
    );
    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return;
    }
    return theme;
  }
}
