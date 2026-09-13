import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByOwner(ownerId: string) {
    return this.prisma.staffMember.findMany({
      where: { ownerId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        email: true,
        permission: true,
        active: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(ownerId: string, dto: CreateStaffDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const staff = await this.prisma.staffMember.create({
        data: {
          ownerId,
          name: dto.name,
          email: dto.email,
          password: passwordHash,
          permission: dto.permission,
        },
      });
      return this.toSafeStaff(staff);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe um funcionário com esse e-mail');
      }
      throw error;
    }
  }

  async update(ownerId: string, id: string, dto: UpdateStaffDto) {
    await this.findOneOrThrow(id, ownerId);

    const staff = await this.prisma.staffMember.update({
      where: { id },
      data: {
        name: dto.name,
        permission: dto.permission,
        active: dto.active,
        password: dto.password
          ? await bcrypt.hash(dto.password, 10)
          : undefined,
      },
    });

    return this.toSafeStaff(staff);
  }

  async remove(ownerId: string, id: string) {
    await this.findOneOrThrow(id, ownerId);

    const staff = await this.prisma.staffMember.update({
      where: { id },
      data: { active: false },
    });

    return this.toSafeStaff(staff);
  }

  async findOneOrThrow(id: string, ownerId: string) {
    const staff = await this.prisma.staffMember.findFirst({
      where: { id, ownerId },
    });

    if (!staff) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return staff;
  }

  private toSafeStaff(staff: {
    id: string;
    ownerId: string;
    name: string;
    email: string;
    permission: string;
    active: boolean;
    createdAt: Date;
  }) {
    return {
      id: staff.id,
      ownerId: staff.ownerId,
      name: staff.name,
      email: staff.email,
      permission: staff.permission,
      active: staff.active,
      createdAt: staff.createdAt,
    };
  }
}
