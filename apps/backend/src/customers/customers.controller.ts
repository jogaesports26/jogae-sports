import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { UpdateBirthDateDto } from './dto/update-birth-date.dto';
import { toCsv } from '../common/csv.util';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURT_OWNER')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.listCustomers(user.sub);
  }

  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const customers = await this.customersService.listCustomers(user.sub);

    const header = [
      'Nome',
      'Telefone',
      'Nascimento',
      'Reservas',
      'Total gasto (R$)',
      'Faltas',
      'Última reserva',
      'Dias desde a última reserva',
    ];

    const rows = customers.map((customer) => [
      customer.name,
      customer.phone,
      customer.birthDate ? customer.birthDate.toLocaleDateString('pt-BR') : '',
      String(customer.totalReservations),
      customer.totalSpent.toFixed(2).replace('.', ','),
      String(customer.noShowCount),
      customer.lastReservationAt.toLocaleDateString('pt-BR'),
      String(customer.daysSinceLastReservation),
    ]);

    const csv = toCsv(header, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
    res.send('﻿' + csv);
  }

  @Get(':phone')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('phone') phone: string,
  ) {
    return this.customersService.getCustomerHistory(user.sub, phone);
  }

  @Patch(':playerId/birth-date')
  updateBirthDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateBirthDateDto,
  ) {
    return this.customersService.updateBirthDate(
      user.sub,
      playerId,
      dto.birthDate,
    );
  }
}
