import { Injectable } from '@nestjs/common';
import { LicenseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUser(userId: string) {
    return this.prisma.license.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });
  }

  async createLicense(data: { userId: string; type: LicenseType }) {
    const expiresAt = this.computeExpiration(data.type);
    return this.prisma.license.create({
      data: {
        userId: data.userId,
        type: data.type,
        status: 'ACTIVE',
        expiresAt,
        code: this.generateLicenseCode(),
      },
    });
  }

  private computeExpiration(type: string) {
    const now = new Date();
    const addDays = (days: number) => {
      const target = new Date(now);
      target.setDate(target.getDate() + days);
      return target;
    };

    switch (type) {
      case 'TRIAL':
        return addDays(1);
      case 'THREE_DAYS':
        return addDays(3);
      case 'SEVEN_DAYS':
        return addDays(7);
      case 'FIFTEEN_DAYS':
        return addDays(15);
      case 'THIRTY_DAYS':
        return addDays(30);
      case 'FOUNDER':
        return addDays(3650);
      default:
        return addDays(7);
    }
  }

  private generateLicenseCode() {
    const segment = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VDJ-${segment()}-${segment()}`;
  }
}
