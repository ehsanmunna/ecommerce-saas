import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Acme Inc', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @ApiProperty({
    example: 'acme',
    description:
      'Globally unique. Lowercase letters, digits, and hyphens only - used to derive the ' +
      'default subdomain and tenant database name.',
    minLength: 3,
    maxLength: 63,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must contain only lowercase letters, digits, and hyphens',
  })
  slug!: string;

  @ApiProperty({ example: 'owner@acme.test' })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ example: 'supersecret123', minLength: 8, maxLength: 200, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  ownerPassword!: string;

  @ApiProperty({ example: 'BASIC' })
  @IsString()
  plan!: string;
}
