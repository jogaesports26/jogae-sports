import { Injectable, Logger } from '@nestjs/common';

export interface NotificationResult {
  sent: boolean;
  devMessage: string;
}

/**
 * Sem provedor de SMS/WhatsApp configurado ainda (ver notas do plano de
 * expansão). Segue o mesmo padrão de degradação graciosa do OTP e da
 * recuperação de senha: loga a mensagem que seria enviada em vez de falhar.
 * Trocar o corpo de `send` por uma chamada real (Twilio, Z-API etc.) quando
 * houver um provedor configurado, sem precisar mudar os call sites.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  send(phone: string, message: string): Promise<NotificationResult> {
    this.logger.log(`[DEV] Notificação para ${phone}: ${message}`);
    return Promise.resolve({ sent: false, devMessage: message });
  }

  private formatSlot(startsAt: Date, endsAt: Date) {
    const date = startsAt.toLocaleDateString('pt-BR');
    const start = startsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const end = endsAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date}, ${start}–${end}`;
  }

  notifyReservationConfirmed(
    phone: string,
    courtName: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.send(
      phone,
      `Reserva confirmada em ${courtName}: ${this.formatSlot(startsAt, endsAt)}.`,
    );
  }

  notifyReservationCancelled(
    phone: string,
    courtName: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.send(
      phone,
      `Reserva cancelada em ${courtName}: ${this.formatSlot(startsAt, endsAt)}.`,
    );
  }

  notifyReservationRescheduled(
    phone: string,
    courtName: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.send(
      phone,
      `Reserva reagendada em ${courtName}: novo horário ${this.formatSlot(startsAt, endsAt)}.`,
    );
  }

  notifyReservationReminder(
    phone: string,
    courtName: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.send(
      phone,
      `Lembrete: você tem uma reserva em ${courtName} hoje, ${this.formatSlot(startsAt, endsAt)}.`,
    );
  }

  notifyWaitlistSlotAvailable(
    phone: string,
    courtName: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    return this.send(
      phone,
      `Abriu uma vaga em ${courtName} no horário que você queria: ${this.formatSlot(startsAt, endsAt)}. Corre lá pra reservar!`,
    );
  }
}
