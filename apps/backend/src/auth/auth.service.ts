import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RESERVED_SLUGS } from '../common/reserved-slugs';
import {
  buildStoredTheme,
  resolveTheme,
  type StoredTheme,
  type ThemeInput,
} from '../theme/theme.util';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE =
  'Se esse e-mail existir, enviaremos um link de redefinição.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Já existe uma conta com esse e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
        role: 'COURT_OWNER',
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentName: user.establishmentName,
      establishmentPhone: user.establishmentPhone,
      establishmentAddress: user.establishmentAddress,
      establishmentSlug: user.establishmentSlug,
      monthlyRevenueGoal: user.monthlyRevenueGoal
        ? Number(user.monthlyRevenueGoal)
        : null,
      aboutDescription: user.aboutDescription,
      coverPhotoUrl: user.coverPhotoUrl,
      amenities: user.amenities,
      theme: (user.theme as StoredTheme | null) ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.updateProfileRow(userId, dto);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      establishmentName: user.establishmentName,
      establishmentPhone: user.establishmentPhone,
      establishmentAddress: user.establishmentAddress,
      establishmentSlug: user.establishmentSlug,
      monthlyRevenueGoal: user.monthlyRevenueGoal
        ? Number(user.monthlyRevenueGoal)
        : null,
      aboutDescription: user.aboutDescription,
      coverPhotoUrl: user.coverPhotoUrl,
      amenities: user.amenities,
      theme: (user.theme as StoredTheme | null) ?? null,
    };
  }

  private async updateProfileRow(userId: string, dto: UpdateProfileDto) {
    const { theme, ...rest } = dto;

    if (dto.establishmentSlug && RESERVED_SLUGS.has(dto.establishmentSlug)) {
      throw new BadRequestException(
        'Esse link é reservado pelo sistema, escolha outro',
      );
    }
    const data: Prisma.UserUpdateInput = { ...rest };

    if (theme !== undefined) {
      const current = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { theme: true },
      });
      data.theme = buildStoredTheme(
        theme,
        current.theme as StoredTheme | null,
      ) as unknown as Prisma.InputJsonValue;
    }

    try {
      return await this.prisma.user.update({ where: { id: userId }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Esse link já está em uso, escolha outro');
      }
      throw error;
    }
  }

  /** Calcula o tema sem gravar — alimenta o preview ao vivo do painel. */
  previewTheme(input: ThemeInput) {
    return resolveTheme(input);
  }

  /** Volta pra uma versão anterior do tema (índice 0 = a mais recente do histórico). */
  async restoreTheme(userId: string, index: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { theme: true },
    });
    const current = user.theme as StoredTheme | null;
    const target = current?.history?.[index];
    if (!current || !target) {
      throw new BadRequestException('Versão de tema não encontrada.');
    }
    const restored = buildStoredTheme(target, current);
    await this.prisma.user.update({
      where: { id: userId },
      data: { theme: restored as unknown as Prisma.InputJsonValue },
    });
    return restored;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Não revela se o e-mail existe ou não — mesma resposta nos dois casos.
      return { message: GENERIC_RESET_MESSAGE };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    // Sem provedor de e-mail transacional configurado ainda (ver card "Recuperação de
    // Senha" do Trello). Em dev, o token volta na própria resposta pra não travar o
    // fluxo; trocar por um envio real (Resend, SendGrid etc.) antes de ir pra produção.
    return { message: GENERIC_RESET_MESSAGE, devResetToken: rawToken };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!resetToken) {
      throw new BadRequestException('Link inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso' };
  }

  private buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
