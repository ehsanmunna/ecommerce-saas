import { IsEmail } from 'class-validator';

export class PlatformForgotPasswordDto {
  @IsEmail()
  email!: string;
}
