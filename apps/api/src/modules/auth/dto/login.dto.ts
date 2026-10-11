import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'owner@acme.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123', writeOnly: true })
  @IsString()
  @MinLength(1)
  password!: string;
}
