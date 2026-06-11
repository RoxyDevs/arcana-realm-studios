import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getLicenses() {
    return this.prisma.license.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
