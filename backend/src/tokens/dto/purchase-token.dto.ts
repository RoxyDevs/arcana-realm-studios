import { IsNotEmpty, IsString } from 'class-validator';

export class PurchaseTokenDto {
  @IsString()
  @IsNotEmpty()
  packageId!: string;
}