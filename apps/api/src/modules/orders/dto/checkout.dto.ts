import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @MinLength(1)
  shippingRecipient!: string;

  @IsString()
  @MinLength(1)
  shippingLine1!: string;

  @IsOptional()
  @IsString()
  shippingLine2?: string;

  @IsString()
  @MinLength(1)
  shippingCity!: string;

  @IsOptional()
  @IsString()
  shippingRegion?: string;

  @IsString()
  @MinLength(1)
  shippingPostalCode!: string;

  @IsString()
  @MinLength(1)
  shippingCountry!: string;

  @IsIn(['STANDARD', 'EXPRESS'])
  deliveryMethod!: 'STANDARD' | 'EXPRESS';

  @IsString()
  @MinLength(1)
  paymentMethod!: string;
}
