import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MaxLength(200)
  recipient!: string;

  @IsString()
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @MaxLength(100)
  country!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
