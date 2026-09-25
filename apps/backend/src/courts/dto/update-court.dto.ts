import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
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

  // Duração máxima de uma reserva nessa quadra, em minutos. null = sem limite.
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsInt()
  @Min(5)
  @Max(24 * 60)
  maxBookingMinutes?: number | null;

  // Passo (granularidade) usado ao gerar horários automaticamente na tela
  // de preços — só afeta o gerador, não a disponibilidade oferecida ao jogador.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(24 * 60)
  slotStepMinutes?: number;

  // Passo (granularidade) dos horários de início oferecidos ao jogador,
  // independente de como as regras de preço foram cadastradas.
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(24 * 60)
  bookingStepMinutes?: number;
}
