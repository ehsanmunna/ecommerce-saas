import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED'] })
  @IsIn(['ACTIVE', 'SUSPENDED', 'EXPIRED'])
  status!: string;
}
