import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class PlayerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.otpCode.create({ data: { phone, code, expiresAt } });

    // Sem provedor de SMS/WhatsApp configurado ainda (ver card "Notificações" do Trello).
    // Em dev, o código volta na própria resposta pra não travar o fluxo; trocar por um
    // envio real (Twilio Verify, Z-API etc.) antes de ir pra produção.
    return { message: 'Código enviado', devCode: code };
  }

  async verifyOtp(phone: string, code: string) {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    const player = await this.prisma.player.upsert({
      where: { phone },
      update: { phoneVerifiedAt: new Date() },
      create: { phone, phoneVerifiedAt: new Date() },
    });

    const accessToken = this.jwtService.sign({
      sub: player.id,
      phone: player.phone,
      role: 'PLAYER',
    });

    return {
      accessToken,
      player: { id: player.id, phone: player.phone, name: player.name },
    };
  }

  async getProfile(playerId: string) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { id: playerId },
    });
    return { id: player.id, phone: player.phone, name: player.name };
  }

  async updateName(playerId: string, name: string) {
    const player = await this.prisma.player.update({
      where: { id: playerId },
      data: { name },
    });
    return { id: player.id, phone: player.phone, name: player.name };
  }
}
