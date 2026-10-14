import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { StaffPermission } from '@prisma/client';
import { IsStrongPassword } from '../../common/strong-password';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(StaffPermission)
  permission?: StaffPermission;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;
}
