import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTokenPackageDto } from './dto/create-token-package.dto';
import { PurchaseTokenDto } from './dto/purchase-token.dto';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  async getPackages() {
    return this.tokensService.getActivePackages();
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchase(@Body() body: PurchaseTokenDto, @Req() request: any) {
    return this.tokensService.purchaseToken(request.user.id, body.packageId);
  }

  // Solo admin (puedes protegerlo con RolesGuard después)
  @Post('admin/create-package')
  async createPackage(@Body() body: CreateTokenPackageDto) {
    return this.tokensService.createPackage(body);
  }
}