import { ApiProperty } from '@nestjs/swagger';

class AuthenticatedUserDto {
  @ApiProperty({ example: 'a2a20270-b704-406c-8603-6be1e75133fb' })
  id!: string;

  @ApiProperty({ example: 'owner@acme.test' })
  email!: string;

  @ApiProperty({ example: 'OWNER' })
  role!: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token, short-lived' })
  accessToken!: string;

  @ApiProperty({ description: 'Opaque refresh token, exchange via POST /auth/refresh' })
  refreshToken!: string;

  @ApiProperty({ type: AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}
