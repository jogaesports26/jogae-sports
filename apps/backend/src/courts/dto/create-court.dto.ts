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

export class CreateCourtDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsIn(SPORTS)
  sport: string;

  @IsIn(SURFACE_TYPES)
  surfaceType: string;

  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photoUrls?: string[];
}
