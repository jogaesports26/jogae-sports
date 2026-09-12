import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

function buildPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };
}

function buildJwtServiceMock() {
  return { sign: jest.fn().mockReturnValue('fake.jwt.token') };
}

describe('AuthService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let jwtService: ReturnType<typeof buildJwtServiceMock>;
  let service: AuthService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    jwtService = buildJwtServiceMock();
    service = new AuthService(prisma as any, jwtService as any);
  });

  describe('register', () => {
    it('rejeita e-mail já cadastrado', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          name: 'Fulano',
          email: 'fulano@teste.com',
          password: 'senha123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('salva a senha com hash, nunca em texto puro', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'user-1', role: 'COURT_OWNER', ...data }),
      );

      await service.register({
        name: 'Fulano',
        email: 'fulano@teste.com',
        password: 'senha123',
      });

      const savedPassword = prisma.user.create.mock.calls[0][0].data.password;
      expect(savedPassword).not.toBe('senha123');
      expect(bcrypt.compareSync('senha123', savedPassword)).toBe(true);
    });

    it('sempre cria como COURT_OWNER, ignorando qualquer role vinda do DTO', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'user-1', ...data }),
      );

      await service.register({
        name: 'Fulano',
        email: 'fulano@teste.com',
        password: 'senha123',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'COURT_OWNER' }),
        }),
      );
    });
  });

  describe('login', () => {
    it('rejeita e-mail inexistente', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@teste.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejeita senha incorreta', async () => {
      const passwordHash = bcrypt.hashSync('senhacerta', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Fulano',
        email: 'fulano@teste.com',
        password: passwordHash,
        role: 'COURT_OWNER',
      });

      await expect(
        service.login({ email: 'fulano@teste.com', password: 'senhaerrada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('autentica com a senha correta e retorna um accessToken', async () => {
      const passwordHash = bcrypt.hashSync('senhacerta', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Fulano',
        email: 'fulano@teste.com',
        password: passwordHash,
        role: 'COURT_OWNER',
      });

      const result = await service.login({
        email: 'fulano@teste.com',
        password: 'senhacerta',
      });

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(result.user.email).toBe('fulano@teste.com');
    });
  });
});
