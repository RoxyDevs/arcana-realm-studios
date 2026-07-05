// src/payments/payments.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createPayPalOrder(userId: string, amount: number, currency: string = 'USD') {
    // Aquí iría la lógica real con @paypal/checkout-server-sdk
    // Por ahora devolvemos una estructura simulada lista para implementar

    return {
      success: true,
      message: 'Orden de PayPal creada (simulada)',
      orderId: `PAY-${Date.now()}`,
      amount,
      currency,
      userId,
      approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=SIMULATED`,
    };
  }

  async capturePayPalOrder(orderId: string) {
    // Lógica real de captura de PayPal
    return {
      success: true,
      message: 'Pago capturado exitosamente (simulado)',
      orderId,
    };
  }
}import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PaymentsService {
  private client: any;

  constructor(private readonly configService: ConfigService) {
    const environment = this.buildEnvironment();
    this.client = new paypal.core.PayPalHttpClient(environment);
  }

  private buildEnvironment() {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const mode = this.configService.get<string>('PAYPAL_MODE', 'sandbox');

    if (mode === 'live') {
      return new paypal.core.LiveEnvironment(clientId, clientSecret);
    }

    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }

  async createOrder(amount: number, currency = 'USD') {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
    });

    const response = await this.client.execute(request);
    return response.result;
  }

  async captureOrder(orderId: string) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});
    const response = await this.client.execute(request);
    return response.result;
  }
}
