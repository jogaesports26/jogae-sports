import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  ArrayMaxSize,
  IsArray,
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

  /** Quadras onde o equipamento aparece. Vazio ou ausente = todas as quadras do dono. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  courtIds?: string[];
}
