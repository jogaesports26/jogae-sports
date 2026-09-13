import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100000)
  pricePerUnit?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
