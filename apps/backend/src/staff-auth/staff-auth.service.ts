import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { StaffLoginDto } from './dto/staff-login.dto';

@Injectable()
export class StaffAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: StaffLoginDto) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { email: dto.email },
    });

    if (!staff || !staff.active) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(dto.password, staff.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const accessToken = this.jwtService.sign({
      sub: staff.id,
      email: staff.email,
      role: 'STAFF',
      ownerId: staff.ownerId,
      permission: staff.permission,
    });

    return {
      accessToken,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: 'STAFF',
        permission: staff.permission,
      },
    };
  }
}
