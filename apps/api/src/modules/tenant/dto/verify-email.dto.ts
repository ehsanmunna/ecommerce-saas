import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'a3f1c9...64 hex chars',
    description: 'Single-use verification token from the signup email link',
  })
  @IsString()
  @MinLength(32)
  token!: string;
}
