import { randomInt } from 'node:crypto';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AttemptLimiter } from '../common/rate-limit/attempt-limiter';
import { isOtpDevCodeExposed } from '../config/env';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_WINDOW_MS = 10 * 60 * 1000;
const MAX_OTP_REQUESTS = 3;
const MAX_VERIFY_FAILURES = 5;

const tooMany = (message: string) =>
  new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);

@Injectable()
export class PlayerAuthService {
  // Em memória (instância única). Limites por telefone, somados ao throttler por IP.
  private readonly requests = new AttemptLimiter(
    MAX_OTP_REQUESTS,
    OTP_WINDOW_MS,
  );
  private readonly failures = new AttemptLimiter(
    MAX_VERIFY_FAILURES,
    OTP_WINDOW_MS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(phone: string) {
    if (!this.requests.hit(phone)) {
      throw tooMany(
        'Muitos códigos solicitados. Tente novamente em alguns minutos.',
      );
    }

    const code = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.prisma.otpCode.create({ data: { phone, code, expiresAt } });

    // Sem provedor de SMS/WhatsApp configurado ainda (ver card "Notificações" do Trello).
    // O código só volta na resposta se OTP_EXPOSE_DEV_CODE=true (ambiente de demonstração,
    // com dados fictícios). Deve ficar desligada antes de qualquer cliente real.
    return isOtpDevCodeExposed()
      ? { message: 'Código enviado', devCode: code }
      : { message: 'Código enviado' };
  }

  async verifyOtp(phone: string, code: string) {
    if (this.failures.isBlocked(phone)) {
      throw tooMany('Muitas tentativas. Solicite um novo código mais tarde.');
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, code, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      this.failures.hit(phone);
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    this.failures.reset(phone);

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
