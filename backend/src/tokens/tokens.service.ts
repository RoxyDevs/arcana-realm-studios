import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTokenPackageDto } from './dto/create-token-package.dto';

@Injectable()
export class TokensService {
  constructor(private readonly prisma: PrismaService) {}

  // Crear paquetes de tokens (solo admin)
  async createPackage(dto: CreateTokenPackageDto) {
    return this.prisma.tokenPackage.create({ data: dto });
  }

  // Obtener paquetes activos
  async getActivePackages() {
    return this.prisma.tokenPackage.findMany({
      where: { isActive: true },
      orderBy: { days: 'asc' },
    });
  }

  // Comprar un paquete de tokens (crea la licencia)
  async purchaseToken(userId: string, packageId: string) {
    const pkg = await this.prisma.tokenPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Paquete no encontrado o inactivo');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.days);

    const license = await this.prisma.license.create({
      data: {
        userId,
        packageId: pkg.id,
        type: 'THIRTY_DAYS', // o crear un nuevo enum si quieres
        status: 'ACTIVE',
        code: this.generateLicenseCode(),
        maxRooms: pkg.days >= 90 ? 10 : 5, // más habitaciones según el plan
        expiresAt,
      },
    });

    return {
      success: true,
      message: `Has adquirido ${pkg.name}`,
      license,
    };
  }

  private generateLicenseCode(): string {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VDJ-${segment()}-${segment()}`;
  }
}