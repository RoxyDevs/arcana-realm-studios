import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}
