import { ApiProperty } from '@nestjs/swagger';

export class TenantSummaryResponseDto {
  @ApiProperty({ example: 'c67fb8c4-9e2a-4f56-846a-01c248583d39' })
  id!: string;

  @ApiProperty({ example: 'Acme Inc' })
  name!: string;

  @ApiProperty({ example: 'acme' })
  slug!: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: [
      'PENDING_VERIFICATION',
      'PROVISIONING',
      'ACTIVE',
      'PROVISIONING_FAILED',
      'SUSPENDED',
    ],
  })
  status!: string;
}
