import { HttpException, UnauthorizedException } from '@nestjs/common';
import { PlayerAuthService } from './player-auth.service';

describe('PlayerAuthService (OTP)', () => {
  const original = process.env.OTP_EXPOSE_DEV_CODE;
  const prisma = {
    otpCode: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    player: { upsert: jest.fn() },
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  let service: PlayerAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OTP_EXPOSE_DEV_CODE;
    service = new PlayerAuthService(prisma as never, jwt as never);
  });

  afterAll(() => {
    if (original === undefined) delete process.env.OTP_EXPOSE_DEV_CODE;
    else process.env.OTP_EXPOSE_DEV_CODE = original;
  });

  it('não devolve o código por padrão e grava um código de 6 dígitos', async () => {
    const result = await service.requestOtp('85999990000');
    expect(result).toEqual({ message: 'Código enviado' });
    const saved = prisma.otpCode.create.mock.calls[0][0].data.code as string;
    expect(saved).toMatch(/^\d{6}$/);
  });

  it('devolve devCode só com OTP_EXPOSE_DEV_CODE=true', async () => {
    process.env.OTP_EXPOSE_DEV_CODE = 'true';
    const result = await service.requestOtp('85999990000');
    expect(result).toHaveProperty('devCode');
  });

  it('limita pedidos de código por telefone', async () => {
    await service.requestOtp('85999990000');
    await service.requestOtp('85999990000');
    await service.requestOtp('85999990000');
    await expect(service.requestOtp('85999990000')).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(service.requestOtp('85988880000')).resolves.toBeDefined();
  });

  it('bloqueia o telefone após 5 códigos errados, mesmo que o próximo seja certo', async () => {
    prisma.otpCode.findFirst.mockResolvedValue(null);
    for (let i = 0; i < 5; i++) {
      await expect(
        service.verifyOtp('85999990000', '000000'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
    prisma.otpCode.findFirst.mockResolvedValue({ id: '1' });
    await expect(
      service.verifyOtp('85999990000', '123456'),
    ).rejects.toMatchObject({ status: 429 });
    expect(prisma.otpCode.update).not.toHaveBeenCalled();
  });

  it('zera as falhas após um login válido', async () => {
    prisma.otpCode.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.verifyOtp('85999990000', '000000'),
    ).rejects.toBeDefined();
    prisma.otpCode.findFirst.mockResolvedValueOnce({ id: '1' });
    prisma.player.upsert.mockResolvedValue({
      id: 'p',
      phone: '85999990000',
      name: null,
    });
    await expect(
      service.verifyOtp('85999990000', '123456'),
    ).resolves.toMatchObject({
      accessToken: 'token',
    });
  });
});
