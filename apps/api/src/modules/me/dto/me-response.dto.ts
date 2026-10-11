import { ApiProperty } from '@nestjs/swagger';
import { TenantSummaryResponseDto } from '../../tenant/dto/tenant-summary-response.dto';

class MeUserDto {
  @ApiProperty({ example: 'a2a20270-b704-406c-8603-6be1e75133fb' })
  id!: string;

  @ApiProperty({ example: 'owner@acme.test' })
  email!: string;

  @ApiProperty({ example: 'OWNER' })
  role!: string;
}

export class MeResponseDto {
  @ApiProperty({ type: TenantSummaryResponseDto })
  tenant!: TenantSummaryResponseDto;

  @ApiProperty({ type: MeUserDto, nullable: true })
  user!: MeUserDto | null;
}
