import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByOwner(ownerId: string) {
    return this.prisma.instructor.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }

  create(ownerId: string, dto: CreateInstructorDto) {
    return this.prisma.instructor.create({
      data: { ownerId, name: dto.name, phone: dto.phone },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateInstructorDto) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.instructor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOneOrThrow(id, ownerId);

    return this.prisma.instructor.update({
      where: { id },
      data: { active: false },
    });
  }

  async findOneOrThrow(id: string, ownerId: string) {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id, ownerId },
    });

    if (!instructor) {
      throw new NotFoundException('Instrutor não encontrado');
    }

    return instructor;
  }
}
