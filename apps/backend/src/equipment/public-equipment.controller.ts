import { Controller, Get, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

@Controller('public/courts/:courtId/equipment')
export class PublicEquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findActive(@Param('courtId') courtId: string) {
    return this.equipmentService.findActiveForCourt(courtId);
  }
}
