import { IsISO8601, IsString, MinLength } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @MinLength(2)
  guestName: string;

  @IsString()
  @MinLength(8)
  guestPhone: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}
