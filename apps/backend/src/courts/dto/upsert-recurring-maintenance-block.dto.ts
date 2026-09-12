import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecurringMaintenanceBlockItemDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpsertRecurringMaintenanceBlocksDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RecurringMaintenanceBlockItemDto)
  blocks: RecurringMaintenanceBlockItemDto[];
}
