import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class ReservationEquipmentItemDto {
  @IsUUID()
  equipmentId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}
