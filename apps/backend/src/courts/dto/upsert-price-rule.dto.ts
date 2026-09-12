import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceRuleItemDto {
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

  @IsNumber()
  @IsPositive()
  pricePerHour: number;
}

export class UpsertPriceRulesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PriceRuleItemDto)
  rules: PriceRuleItemDto[];
}
