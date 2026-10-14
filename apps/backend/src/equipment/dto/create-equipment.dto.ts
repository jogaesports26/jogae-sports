import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
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

  /** Quadras onde o equipamento aparece. Vazio ou ausente = todas as quadras do dono. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  courtIds?: string[];
}
