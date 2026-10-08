import { ApiProperty } from '@nestjs/swagger';

export class CheckSlugResponseDto {
  @ApiProperty({ example: true })
  available!: boolean;

  @ApiProperty({
    example: 'taken',
    enum: ['invalid', 'reserved', 'taken'],
    required: false,
  })
  reason?: 'invalid' | 'reserved' | 'taken';
}
