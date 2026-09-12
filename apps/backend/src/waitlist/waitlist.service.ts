import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourtsService } from '../courts/courts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courtsService: CourtsService,
    private readonly notifications: NotificationsService,
  ) {}

  async join(courtId: string, dto: JoinWaitlistDto) {
    const court = await this.prisma.court.findFirst({
      where: { id: courtId, active: true },
    });

    if (!court) {
      throw new NotFoundException('Quadra não encontrada');
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'O horário final deve ser depois do horário inicial',
      );
    }

    return this.prisma.waitlist.create({
      data: {
        courtId,
        name: dto.name,
        phone: dto.phone,
        startsAt,
        endsAt,
      },
    });
  }

  async listForOwner(courtId: string, ownerId: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    return this.prisma.waitlist.findMany({
      where: { courtId, notifiedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(courtId: string, ownerId: string, id: string) {
    await this.courtsService.findOneOrThrow(courtId, ownerId);

    const entry = await this.prisma.waitlist.findFirst({
      where: { id, courtId },
    });

    if (!entry) {
      throw new NotFoundException('Registro não encontrado');
    }

    return this.prisma.waitlist.delete({ where: { id } });
  }

  /** Notifica o primeiro da fila cujo horário desejado se sobrepõe ao horário liberado. */
  async notifyForFreedSlot(courtId: string, startsAt: Date, endsAt: Date) {
    const entry = await this.prisma.waitlist.findFirst({
      where: {
        courtId,
        notifiedAt: null,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      orderBy: { createdAt: 'asc' },
      include: { court: { select: { name: true } } },
    });

    if (!entry) return null;

    await this.notifications.notifyWaitlistSlotAvailable(
      entry.phone,
      entry.court.name,
      entry.startsAt,
      entry.endsAt,
    );

    await this.prisma.waitlist.update({
      where: { id: entry.id },
      data: { notifiedAt: new Date() },
    });

    return entry;
  }
}
