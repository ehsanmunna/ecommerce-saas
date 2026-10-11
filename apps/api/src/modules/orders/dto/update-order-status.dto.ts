import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED'])
  status!: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
}
