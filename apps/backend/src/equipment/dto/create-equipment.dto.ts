import { Type } from 'class-transformer';
import {
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @Type(() => Number)
  @IsPositive()
  @Max(100000)
  pricePerUnit: number;
}
