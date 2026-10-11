import { IsString, MinLength } from 'class-validator';

export class PlatformResetPasswordDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
