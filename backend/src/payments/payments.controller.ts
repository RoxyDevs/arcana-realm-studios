// src/payments/payments.controller.ts

import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface AuthenticatedUser {
  id: string;
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @HttpCode(201)
  async createOrder(
    @Body() body: CreatePaymentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.paymentsService.createPayPalOrder(
      request.user.id,
      body.amount,
      body.currency,
    );
  }

  @Post('capture')
  async captureOrder(@Body('orderId') orderId: string) {
    return this.paymentsService.capturePayPalOrder(orderId);
  }
}