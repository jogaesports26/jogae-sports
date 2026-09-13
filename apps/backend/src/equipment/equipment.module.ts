import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EquipmentController } from './equipment.controller';
import { PublicEquipmentController } from './public-equipment.controller';
import { EquipmentService } from './equipment.service';

@Module({
  imports: [AuthModule],
  controllers: [EquipmentController, PublicEquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
