import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { SPORTS, SURFACE_TYPES } from '../constants/court-options';

export class UpdateCourtDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(SPORTS)
  sport?: string;

  @IsOptional()
  @IsIn(SURFACE_TYPES)
  surfaceType?: string;

  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
