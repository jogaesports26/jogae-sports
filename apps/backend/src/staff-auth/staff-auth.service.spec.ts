import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StaffAuthService } from './staff-auth.service';

function buildPrismaMock() {
  return {
    staffMember: {
      findUnique: jest.fn(),
    },
  };
}

function buildJwtServiceMock() {
  return { sign: jest.fn().mockReturnValue('fake.jwt.token') };
}

describe('StaffAuthService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let jwtService: ReturnType<typeof buildJwtServiceMock>;
  let service: StaffAuthService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    jwtService = buildJwtServiceMock();
    service = new StaffAuthService(prisma as any, jwtService as any);
  });

  it('rejeita e-mail inexistente', async () => {
    prisma.staffMember.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ninguem@teste.com', password: 'senha123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita funcionário desativado mesmo com senha correta', async () => {
    const passwordHash = bcrypt.hashSync('senhacerta', 10);
    prisma.staffMember.findUnique.mockResolvedValue({
      id: 'staff-1',
      ownerId: 'owner-1',
      name: 'Fulano',
      email: 'fulano@teste.com',
      password: passwordHash,
      permission: 'MANAGE_RESERVATIONS',
      active: false,
    });

    await expect(
      service.login({ email: 'fulano@teste.com', password: 'senhacerta' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita senha incorreta', async () => {
    const passwordHash = bcrypt.hashSync('senhacerta', 10);
    prisma.staffMember.findUnique.mockResolvedValue({
      id: 'staff-1',
      ownerId: 'owner-1',
      name: 'Fulano',
      email: 'fulano@teste.com',
      password: passwordHash,
      permission: 'MANAGE_RESERVATIONS',
      active: true,
    });

    await expect(
      service.login({ email: 'fulano@teste.com', password: 'senhaerrada' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('autentica com a senha correta e embute ownerId + permission no token', async () => {
    const passwordHash = bcrypt.hashSync('senhacerta', 10);
    prisma.staffMember.findUnique.mockResolvedValue({
      id: 'staff-1',
      ownerId: 'owner-1',
      name: 'Fulano',
      email: 'fulano@teste.com',
      password: passwordHash,
      permission: 'VIEW_ONLY',
      active: true,
    });

    const result = await service.login({
      email: 'fulano@teste.com',
      password: 'senhacerta',
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'staff-1',
        role: 'STAFF',
        ownerId: 'owner-1',
        permission: 'VIEW_ONLY',
      }),
    );
    expect(result.accessToken).toBe('fake.jwt.token');
    expect(result.user.role).toBe('STAFF');
  });
});
