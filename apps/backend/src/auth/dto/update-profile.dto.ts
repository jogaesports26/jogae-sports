import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  establishmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  establishmentPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  establishmentAddress?: string;
}
