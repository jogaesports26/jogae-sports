import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
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

  // Duração mínima de uma reserva nessa quadra, em minutos.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(24 * 60)
  minBookingMinutes?: number;

  // Passo (granularidade) usado ao gerar horários automaticamente na tela
  // de preços — não afeta reservas já criadas.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(24 * 60)
  slotStepMinutes?: number;
}
