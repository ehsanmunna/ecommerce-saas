import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ description: 'Newly issued JWT access token' })
  accessToken!: string;
}
