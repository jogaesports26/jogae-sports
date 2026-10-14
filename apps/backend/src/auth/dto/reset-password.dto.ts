import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/strong-password';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @IsStrongPassword()
  newPassword: string;
}
