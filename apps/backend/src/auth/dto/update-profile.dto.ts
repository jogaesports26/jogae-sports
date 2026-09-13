import {
  ArrayMaxSize,
  IsArray,
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

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverPhotoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  amenities?: string[];
}
