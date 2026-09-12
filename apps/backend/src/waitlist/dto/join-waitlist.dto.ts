import { IsISO8601, IsString, MinLength } from 'class-validator';

export class JoinWaitlistDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}
