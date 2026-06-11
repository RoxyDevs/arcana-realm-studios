import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paypal/create')
  createPaypalOrder(@Body() body: CreatePaymentDto) {
    return this.paymentsService.createOrder(body.amount, body.currency);
  }

  @Post('paypal/capture')
  capturePaypalOrder(@Body('orderId') orderId: string) {
    return this.paymentsService.captureOrder(orderId);
  }
}
