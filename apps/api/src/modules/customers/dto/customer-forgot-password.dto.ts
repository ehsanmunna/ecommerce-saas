import { IsEmail } from 'class-validator';

export class CustomerForgotPasswordDto {
  @IsEmail()
  email!: string;
}
