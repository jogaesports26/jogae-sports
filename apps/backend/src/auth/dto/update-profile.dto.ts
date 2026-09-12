import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'O link só pode ter letras minúsculas, números e hífen',
  })
  establishmentSlug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRevenueGoal?: number;
}
