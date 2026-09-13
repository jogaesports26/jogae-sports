import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentOwnerId } from '../auth/decorators/current-owner-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { toCsv } from '../common/csv.util';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
  NO_SHOW: 'Não compareceu',
};

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class OverviewController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('today')
  @Roles('COURT_OWNER', 'STAFF')
  getToday(@CurrentOwnerId() ownerId: string) {
    return this.reservationsService.getTodayReservations(ownerId);
  }

  @Get('reports')
  getReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reservationsService.getReports(
      user.sub,
      query.from,
      query.to,
      query.courtId,
    );
  }

  @Get('reports/commercial')
  getCommercialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reservationsService.getCommercialReport(
      user.sub,
      query.from,
      query.to,
      query.courtId,
    );
  }

  @Get('reports/export')
  async exportReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportsQueryDto,
    @Res() res: Response,
  ) {
    const rows = await this.reservationsService.getReportRows(
      user.sub,
      query.from,
      query.to,
      query.courtId,
    );

    const header = [
      'Data',
      'Início',
      'Fim',
      'Quadra',
      'Cliente',
      'Telefone',
      'Status',
      'Valor (R$)',
    ];

    const rowsData = rows.map((row) => [
      row.startsAt.toLocaleDateString('pt-BR'),
      row.startsAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      row.endsAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      row.courtName,
      row.guestName ?? '',
      row.guestPhone ?? '',
      STATUS_LABELS[row.status] ?? row.status,
      Number(row.priceSnapshot).toFixed(2).replace('.', ','),
    ]);

    const csv = toCsv(header, rowsData);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="relatorio-${query.from}-a-${query.to}.csv"`,
    );
    res.send('﻿' + csv);
  }
}
