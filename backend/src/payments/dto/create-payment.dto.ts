// src/payments/dto/create-payment.dto.ts

import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}