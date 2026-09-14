import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateVariantDto {
  @IsString()
  sku!: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
