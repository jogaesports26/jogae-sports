import { IsDateString } from 'class-validator';

export class UpdateBirthDateDto {
  @IsDateString()
  birthDate: string;
}
