import { IsISO8601, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateMaintenanceBlockDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsISO8601()
  completedAt?: string;
}
