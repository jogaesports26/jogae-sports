import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ReservationsService } from './reservations.service';

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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const theme = await this.reservationsService.getThemeBySlug(slug);
    const etag = `W/"theme-${slug}-${theme.rev}"`;
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
