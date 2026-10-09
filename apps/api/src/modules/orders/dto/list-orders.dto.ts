import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'] as const;

export class ListOrdersDto {
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  paymentStatus?: (typeof PAYMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
