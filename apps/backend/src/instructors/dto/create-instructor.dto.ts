import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
