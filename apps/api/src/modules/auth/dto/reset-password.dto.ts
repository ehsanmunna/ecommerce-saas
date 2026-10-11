import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-email' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ example: 'newsupersecret123', writeOnly: true })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
