import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReportsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  courtId?: string;
}
