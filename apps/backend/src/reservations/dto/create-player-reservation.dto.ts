import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreatePlayerReservationDto {
  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
