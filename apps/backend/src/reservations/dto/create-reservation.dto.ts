import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ReservationEquipmentItemDto } from '../../equipment/dto/reservation-equipment-item.dto';

export class CreateReservationDto {
  @IsString()
  @MinLength(2)
  guestName: string;

  @IsString()
  @MinLength(8)
  guestPhone: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReservationEquipmentItemDto)
  equipmentItems?: ReservationEquipmentItemDto[];
}
