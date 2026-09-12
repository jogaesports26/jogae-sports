import { IsIn } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsIn(['COMPLETED', 'NO_SHOW'])
  status: 'COMPLETED' | 'NO_SHOW';
}
