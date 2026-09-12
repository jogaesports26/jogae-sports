import { IsDateString } from 'class-validator';

export class AgendaQueryDto {
  @IsDateString()
  weekStart: string;
}
