import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { AgendaQueryDto } from './dto/agenda-query.dto';

@Controller('public/courts')
export class PublicCourtsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  list() {
    return this.reservationsService.listPublicCourts();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.reservationsService.getPublicCourt(id);
  }

  @Get(':id/agenda')
  getAgenda(@Param('id') id: string, @Query() query: AgendaQueryDto) {
    return this.reservationsService.getPublicAgenda(id, query.weekStart);
  }
}
