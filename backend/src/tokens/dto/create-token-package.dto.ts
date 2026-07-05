import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTokenPackageDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(1)
  days!: number;

  @IsNumber()
  @Min(0.99)
  price!: number;

  @IsNumber()
  @IsOptional()
  discount?: number = 0;
}