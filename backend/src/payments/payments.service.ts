import { Injectable } from '@nestjs/common';
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
