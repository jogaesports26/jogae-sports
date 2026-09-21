import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCourtDto {
  @IsString()
  @MinLength(2)
  name: string;

  // Aceita tanto um dos valores pré-definidos (ver constants/court-options.ts,
  // usado só pelo dropdown do frontend) quanto um texto livre digitado quando
  // o dono escolhe "Outro".
  @IsString()
  @MinLength(1)
  sport: string;

  @IsString()
  @MinLength(1)
  surfaceType: string;

  @IsOptional()
  @IsBoolean()
  hasLighting?: boolean;

  // String livre em vez de @IsUrl: também aceita data URLs (fotos enviadas
  // como arquivo, convertidas em base64 no frontend).
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
