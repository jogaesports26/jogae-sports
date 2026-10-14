import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { StaffPermission } from '@prisma/client';
import { IsStrongPassword } from '../../common/strong-password';

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsEnum(StaffPermission)
  permission?: StaffPermission;
}
