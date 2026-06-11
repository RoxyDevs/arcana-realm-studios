import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateLicenseDto } from './dto/create-license.dto';
import { LicensesService } from './licenses.service';
import { Role } from '@prisma/client';

@Controller('licenses')
@UseGuards(AuthGuard('jwt'))
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Get()
  async findCurrentUserLicense(@Req() request: any) {
    return this.licensesService.findActiveByUser(request.user.id);
  }

  @Post()
  async create(@Body() body: CreateLicenseDto, @Req() request: any) {
    if (body.userId && !request.user.roles.includes(Role.ADMIN) && !request.user.roles.includes(Role.FOUNDER)) {
      throw new ForbiddenException('No tienes permiso para crear licencias para otros usuarios.');
    }

    const userId = body.userId ?? request.user.id;
    return this.licensesService.createLicense({ userId, type: body.type });
  }
}
