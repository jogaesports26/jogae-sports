import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCourtDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  // Ver create-court.dto.ts: texto livre pra suportar a opção "Outro".
  @IsOptional()
  @IsString()
  @MinLength(1)
  sport?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  surfaceType?: string;

  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
