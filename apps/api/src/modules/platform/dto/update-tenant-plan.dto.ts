import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateTenantPlanDto {
  @ApiProperty({ enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
  @IsIn(['BASIC', 'PRO', 'ENTERPRISE'])
  plan!: string;
}
