import {
  CouponDiscountType,
  PrismaClient,
  ReservationStatus,
  Role,
  StaffPermission,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const OWNER_PASSWORD = 'Seed@123';
const STAFF_PASSWORD = 'Staff@123';

const now = new Date();
const currentMonth = now.getMonth();

function dateAt(offsetDays: number, hour: number, minute = 0): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function birthDate(month: number, day: number, year: number): Date {
  return new Date(Date.UTC(year, month, day));
}

async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

interface PlayerSeed {
  phone: string;
  name: string;
  birthDate?: Date;
}

// Índices 12 e 13 (Diego, Patrícia) só recebem reservas bem antigas em createReservationsForCourt,
// pra virarem "clientes inativos" de propósito. Índice 6 (Rafael) é forçado nos slots de NO_SHOW
// pra virar o caso de "falta recorrente".
const PLAYERS: PlayerSeed[] = [
  { phone: '11988887001', name: 'João Pedro Almeida', birthDate: birthDate(currentMonth, 5, 1990) },
  { phone: '11988887002', name: 'Marina Costa', birthDate: birthDate((currentMonth + 3) % 12, 12, 1993) },
  { phone: '11988887003', name: 'Lucas Ferreira', birthDate: birthDate((currentMonth + 5) % 12, 20, 1997) },
  { phone: '11988887004', name: 'Beatriz Santos', birthDate: birthDate((currentMonth + 7) % 12, 8, 1999) },
  { phone: '11988887005', name: 'Gabriel Rocha', birthDate: birthDate(currentMonth, 14, 1995) },
  { phone: '11988887006', name: 'Camila Duarte', birthDate: birthDate((currentMonth + 2) % 12, 22, 1992) },
  { phone: '11988887007', name: 'Rafael Nunes', birthDate: birthDate((currentMonth + 9) % 12, 3, 1988) },
  { phone: '11988887008', name: 'Larissa Martins', birthDate: birthDate((currentMonth + 4) % 12, 17, 2001) },
  { phone: '11988887009', name: 'Thiago Barbosa', birthDate: birthDate(currentMonth, 27, 1998) },
  { phone: '11988887010', name: 'Fernanda Ribeiro', birthDate: birthDate((currentMonth + 6) % 12, 9, 1994) },
  { phone: '11988887011', name: 'Bruno Cardoso', birthDate: birthDate((currentMonth + 8) % 12, 30, 1991) },
  { phone: '11988887012', name: 'Juliana Pires', birthDate: birthDate((currentMonth + 1) % 12, 11, 2000) },
  { phone: '11988887013', name: 'Diego Teixeira', birthDate: birthDate((currentMonth + 10) % 12, 25, 1989) },
  { phone: '11988887014', name: 'Patrícia Gomes', birthDate: birthDate((currentMonth + 11) % 12, 2, 1996) },
];

interface CourtSeed {
  name: string;
  sport: string;
  surfaceType: string;
  hasLighting: boolean;
}

interface CouponSeed {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
}

interface EquipmentSeed {
  name: string;
  pricePerUnit: number;
}

interface EstablishmentSeed {
  ownerName: string;
  establishmentName: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  revenueGoal: number;
  courts: CourtSeed[];
  instructors: { name: string; phone: string }[];
  coupons: CouponSeed[];
  equipment: EquipmentSeed[];
  staff: { name: string; email: string; permission: StaffPermission }[];
}

const ESTABLISHMENTS: EstablishmentSeed[] = [
  {
    ownerName: 'Marcos Oliveira',
    establishmentName: 'Arena Vitória',
    email: 'contato@arenavitoria.test',
    phone: '11977771001',
    address: 'Rua das Palmeiras, 450 - São Paulo/SP',
    slug: 'arena-vitoria',
    revenueGoal: 15000,
    courts: [
      { name: 'Quadra 1 - Society', sport: 'Futebol Society', surfaceType: 'Grama sintética', hasLighting: true },
      { name: 'Quadra 2 - Fut7', sport: 'Futebol Fut7', surfaceType: 'Grama sintética', hasLighting: false },
    ],
    instructors: [
      { name: 'Carlos Menezes', phone: '11966661001' },
      { name: 'Adriana Freitas', phone: '11966661002' },
    ],
    coupons: [
      { code: 'BEMVINDO10', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: true },
      {
        code: 'FIDELIDADE20',
        discountType: CouponDiscountType.FIXED,
        discountValue: 20,
        active: true,
        validFrom: dateAt(-30, 0),
        validUntil: dateAt(60, 0),
        usageLimit: 50,
      },
      { code: 'VERAO15', discountType: CouponDiscountType.PERCENT, discountValue: 15, active: false },
      {
        code: 'PROMOJANEIRO',
        discountType: CouponDiscountType.PERCENT,
        discountValue: 20,
        active: true,
        validUntil: dateAt(-10, 0),
      },
    ],
    equipment: [
      { name: 'Colete numerado', pricePerUnit: 5 },
      { name: 'Bola oficial', pricePerUnit: 15 },
      { name: 'Luva de goleiro', pricePerUnit: 10 },
    ],
    staff: [
      { name: 'Renata Souza', email: 'renata.arenavitoria@jogaeseed.test', permission: StaffPermission.MANAGE_RESERVATIONS },
      { name: 'Paulo Vieira', email: 'paulo.arenavitoria@jogaeseed.test', permission: StaffPermission.VIEW_ONLY },
    ],
  },
  {
    ownerName: 'Fernanda Lima',
    establishmentName: 'Ace Tênis Clube',
    email: 'contato@acetenis.test',
    phone: '11977772001',
    address: 'Av. dos Ipês, 1200 - Campinas/SP',
    slug: 'ace-tenis',
    revenueGoal: 12000,
    courts: [
      { name: 'Quadra 1 - Saibro', sport: 'Tênis', surfaceType: 'Saibro', hasLighting: true },
      { name: 'Quadra 2 - Rápida', sport: 'Tênis', surfaceType: 'Piso rápido', hasLighting: true },
    ],
    instructors: [
      { name: 'Roberto Aquino', phone: '11966662001' },
      { name: 'Simone Castro', phone: '11966662002' },
    ],
    coupons: [
      { code: 'BEMVINDO10', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: true },
      {
        code: 'CLUBE20',
        discountType: CouponDiscountType.FIXED,
        discountValue: 20,
        active: true,
        validFrom: dateAt(-20, 0),
        validUntil: dateAt(90, 0),
        usageLimit: 30,
      },
      { code: 'INATIVO10', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: false },
      {
        code: 'ABERTURA25',
        discountType: CouponDiscountType.PERCENT,
        discountValue: 25,
        active: true,
        validUntil: dateAt(-5, 0),
      },
    ],
    equipment: [
      { name: 'Aluguel de raquete', pricePerUnit: 20 },
      { name: 'Tubo de bolinhas', pricePerUnit: 12 },
      { name: 'Toalha', pricePerUnit: 5 },
    ],
    staff: [
      { name: 'Débora Nascimento', email: 'debora.acetenis@jogaeseed.test', permission: StaffPermission.MANAGE_RESERVATIONS },
      { name: 'Igor Ramos', email: 'igor.acetenis@jogaeseed.test', permission: StaffPermission.VIEW_ONLY },
    ],
  },
  {
    ownerName: 'Rafael Souza',
    establishmentName: 'Praiana Vôlei',
    email: 'contato@praianavolei.test',
    phone: '11977773001',
    address: 'Av. Beira Mar, 300 - Santos/SP',
    slug: 'praiana-volei',
    revenueGoal: 9000,
    courts: [
      { name: 'Quadra 1 - Areia', sport: 'Vôlei de Praia', surfaceType: 'Areia', hasLighting: true },
      { name: 'Quadra 2 - Areia', sport: 'Vôlei de Praia', surfaceType: 'Areia', hasLighting: false },
    ],
    instructors: [{ name: 'Vinícius Andrade', phone: '11966663001' }],
    coupons: [
      { code: 'BEMVINDO10', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: true },
      {
        code: 'PRAIA15',
        discountType: CouponDiscountType.FIXED,
        discountValue: 15,
        active: true,
        validFrom: dateAt(-15, 0),
        validUntil: dateAt(45, 0),
        usageLimit: 40,
      },
      { code: 'FORADEUSO', discountType: CouponDiscountType.PERCENT, discountValue: 12, active: false },
      {
        code: 'VERAO26',
        discountType: CouponDiscountType.PERCENT,
        discountValue: 18,
        active: true,
        validUntil: dateAt(-2, 0),
      },
    ],
    equipment: [
      { name: 'Bola de vôlei de praia', pricePerUnit: 15 },
      { name: 'Rede extra', pricePerUnit: 25 },
      { name: 'Protetor solar', pricePerUnit: 8 },
    ],
    staff: [
      { name: 'Tatiane Moreira', email: 'tatiane.praianavolei@jogaeseed.test', permission: StaffPermission.MANAGE_RESERVATIONS },
      { name: 'Eduardo Lopes', email: 'eduardo.praianavolei@jogaeseed.test', permission: StaffPermission.VIEW_ONLY },
    ],
  },
  {
    ownerName: 'Camila Santos',
    establishmentName: 'Move+ Multiesportes',
    email: 'contato@movemais.test',
    phone: '11977774001',
    address: 'Rua Ouro Preto, 88 - Belo Horizonte/MG',
    slug: 'move-mais',
    revenueGoal: 18000,
    courts: [
      { name: 'Quadra 1 - Basquete', sport: 'Basquete', surfaceType: 'Piso emborrachado', hasLighting: true },
      { name: 'Quadra 2 - Futsal', sport: 'Futsal', surfaceType: 'Piso vinílico', hasLighting: true },
      { name: 'Quadra 3 - Vôlei', sport: 'Vôlei', surfaceType: 'Piso vinílico', hasLighting: false },
    ],
    instructors: [
      { name: 'Felipe Cunha', phone: '11966664001' },
      { name: 'Aline Barros', phone: '11966664002' },
    ],
    coupons: [
      { code: 'BEMVINDO10', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: true },
      {
        code: 'MOVE20',
        discountType: CouponDiscountType.FIXED,
        discountValue: 20,
        active: true,
        validFrom: dateAt(-25, 0),
        validUntil: dateAt(75, 0),
        usageLimit: 60,
      },
      { code: 'PAUSADO', discountType: CouponDiscountType.PERCENT, discountValue: 10, active: false },
      {
        code: 'INAUGURACAO',
        discountType: CouponDiscountType.PERCENT,
        discountValue: 30,
        active: true,
        validUntil: dateAt(-15, 0),
      },
    ],
    equipment: [
      { name: 'Colete numerado', pricePerUnit: 5 },
      { name: 'Bola de basquete', pricePerUnit: 12 },
      { name: 'Bola de futsal', pricePerUnit: 12 },
    ],
    staff: [
      { name: 'Wesley Correia', email: 'wesley.movemais@jogaeseed.test', permission: StaffPermission.MANAGE_RESERVATIONS },
      { name: 'Priscila Farias', email: 'priscila.movemais@jogaeseed.test', permission: StaffPermission.VIEW_ONLY },
    ],
  },
];

// Padrão de 10 slots por quadra: 7 passados (5 concluídas, 1 no-show, 1 cancelada) + 3 futuros (confirmadas).
const PAST_OFFSETS_DAYS = [-45, -38, -30, -24, -17, -10, -4];
const PAST_STATUSES: ReservationStatus[] = [
  ReservationStatus.COMPLETED,
  ReservationStatus.COMPLETED,
  ReservationStatus.COMPLETED,
  ReservationStatus.COMPLETED,
  ReservationStatus.NO_SHOW,
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED,
];
const FUTURE_OFFSETS_DAYS = [2, 6, 11];
const HOUR_SLOTS = [8, 9, 10, 14, 15, 16, 18, 19, 20, 21];

let globalPlayerCursor = 0;
let globalCourtCursor = 0;
const NO_SHOW_PLAYER_PHONE = '11988887007'; // Rafael Nunes — falta recorrente de propósito
let noShowAssignedCount = 0;

function nextPlayer(playersByPhone: Map<string, { id: string; phone: string }>): { id: string; phone: string } {
  const seed = PLAYERS[globalPlayerCursor % PLAYERS.length];
  globalPlayerCursor += 1;
  return playersByPhone.get(seed.phone)!;
}

async function wipeOwnerData(ownerId: string): Promise<void> {
  const courts = await prisma.court.findMany({ where: { ownerId }, select: { id: true } });
  const courtIds = courts.map((c) => c.id);

  if (courtIds.length > 0) {
    await prisma.review.deleteMany({ where: { courtId: { in: courtIds } } });
    await prisma.reservation.deleteMany({ where: { courtId: { in: courtIds } } });
  }
  await prisma.court.deleteMany({ where: { ownerId } });
  await prisma.instructor.deleteMany({ where: { ownerId } });
  await prisma.coupon.deleteMany({ where: { ownerId } });
  await prisma.equipment.deleteMany({ where: { ownerId } });
  await prisma.staffMember.deleteMany({ where: { ownerId } });
}

async function seedPlayers(): Promise<Map<string, { id: string; phone: string }>> {
  const map = new Map<string, { id: string; phone: string }>();
  for (const p of PLAYERS) {
    const player = await prisma.player.upsert({
      where: { phone: p.phone },
      update: { name: p.name, birthDate: p.birthDate },
      create: { phone: p.phone, name: p.name, birthDate: p.birthDate, phoneVerifiedAt: now },
    });
    map.set(p.phone, { id: player.id, phone: player.phone });
  }
  return map;
}

async function createReservationsForCourt(
  courtId: string,
  pricePerHour: number,
  playersByPhone: Map<string, { id: string; phone: string }>,
  instructorIds: string[],
  coupons: { id: string; discountType: CouponDiscountType; discountValue: number }[],
  equipmentList: { id: string; name: string; pricePerUnit: number }[],
): Promise<void> {
  const activeCoupon = coupons[0];
  const isFirstCourtsBatch = globalCourtCursor < 4 && noShowAssignedCount < 3;

  const slots: { offsetDays: number; status: ReservationStatus; isFuture: boolean }[] = [
    ...PAST_OFFSETS_DAYS.map((offsetDays, i) => ({ offsetDays, status: PAST_STATUSES[i], isFuture: false })),
    ...FUTURE_OFFSETS_DAYS.map((offsetDays) => ({ offsetDays, status: ReservationStatus.CONFIRMED, isFuture: true })),
  ];

  for (let i = 0; i < slots.length; i++) {
    const { offsetDays, status, isFuture } = slots[i];
    const hour = HOUR_SLOTS[i % HOUR_SLOTS.length];
    const startsAt = dateAt(offsetDays, hour);
    const endsAt = addMinutes(startsAt, 60);

    const useGuest = isFuture && i === slots.length - 1 && globalCourtCursor % 2 === 0;

    let player: { id: string; phone: string } | undefined;
    if (!useGuest) {
      if (status === ReservationStatus.NO_SHOW && isFirstCourtsBatch) {
        player = playersByPhone.get(NO_SHOW_PLAYER_PHONE)!;
        noShowAssignedCount += 1;
      } else {
        player = nextPlayer(playersByPhone);
      }
    }

    let couponId: string | undefined;
    let discountAmount: number | undefined;
    if (activeCoupon && (i === 2 || i === 8)) {
      couponId = activeCoupon.id;
      discountAmount =
        activeCoupon.discountType === CouponDiscountType.PERCENT
          ? Math.round(((pricePerHour * activeCoupon.discountValue) / 100) * 100) / 100
          : Math.min(activeCoupon.discountValue, pricePerHour);
    }

    const instructorId = instructorIds.length > 0 && (i === 1 || i === 5) ? instructorIds[i % instructorIds.length] : undefined;

    const priceSnapshot = pricePerHour - (discountAmount ?? 0);

    const reservation = await prisma.reservation.create({
      data: {
        courtId,
        playerId: player?.id,
        guestName: useGuest ? 'Convidado da Casa' : undefined,
        guestPhone: useGuest ? '11999990000' : undefined,
        startsAt,
        endsAt,
        status,
        priceSnapshot,
        cancelledAt: status === ReservationStatus.CANCELLED ? addMinutes(startsAt, -60 * 24) : undefined,
        instructorId,
        couponId,
        discountAmount,
      },
    });

    if (couponId) {
      await prisma.coupon.update({ where: { id: couponId }, data: { usageCount: { increment: 1 } } });
    }

    if (equipmentList.length > 0 && (i === 4 || i === 6)) {
      const item = equipmentList[i % equipmentList.length];
      await prisma.reservationEquipment.create({
        data: {
          reservationId: reservation.id,
          equipmentId: item.id,
          name: item.name,
          unitPrice: item.pricePerUnit,
          quantity: i === 4 ? 2 : 1,
        },
      });
    }

    if (status === ReservationStatus.COMPLETED && player && (i === 0 || i === 3)) {
      await prisma.review.create({
        data: {
          reservationId: reservation.id,
          courtId,
          playerId: player.id,
          rating: i === 0 ? 5 : 3,
          comment:
            i === 0
              ? 'Quadra muito bem cuidada e atendimento excelente, com certeza volto!'
              : 'Bom no geral, mas o vestiário poderia estar mais limpo.',
          createdAt: addMinutes(endsAt, 30),
        },
      });
    }
  }

  // Duas reservas extras bem antigas, isoladas, pra Diego e Patrícia entrarem como "clientes inativos"
  if (globalCourtCursor === 0) {
    const diego = playersByPhone.get('11988887013')!;
    const patricia = playersByPhone.get('11988887014')!;
    for (const [player, offset] of [
      [diego, -80],
      [patricia, -95],
    ] as const) {
      const startsAt = dateAt(offset, 17);
      await prisma.reservation.create({
        data: {
          courtId,
          playerId: player.id,
          startsAt,
          endsAt: addMinutes(startsAt, 60),
          status: ReservationStatus.COMPLETED,
          priceSnapshot: pricePerHour,
        },
      });
    }
  }

  globalCourtCursor += 1;
}

async function seedEstablishment(spec: EstablishmentSeed, playersByPhone: Map<string, { id: string; phone: string }>) {
  const passwordHash = await hash(OWNER_PASSWORD);
  const owner = await prisma.user.upsert({
    where: { email: spec.email },
    update: {
      name: spec.ownerName,
      password: passwordHash,
      role: Role.COURT_OWNER,
      establishmentName: spec.establishmentName,
      establishmentPhone: spec.phone,
      establishmentAddress: spec.address,
      establishmentSlug: spec.slug,
      monthlyRevenueGoal: spec.revenueGoal,
    },
    create: {
      name: spec.ownerName,
      email: spec.email,
      password: passwordHash,
      role: Role.COURT_OWNER,
      establishmentName: spec.establishmentName,
      establishmentPhone: spec.phone,
      establishmentAddress: spec.address,
      establishmentSlug: spec.slug,
      monthlyRevenueGoal: spec.revenueGoal,
    },
  });

  await wipeOwnerData(owner.id);

  const instructors = await Promise.all(
    spec.instructors.map((i) => prisma.instructor.create({ data: { ownerId: owner.id, name: i.name, phone: i.phone } })),
  );

  const coupons = await Promise.all(
    spec.coupons.map((c) =>
      prisma.coupon.create({
        data: {
          ownerId: owner.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          active: c.active,
          validFrom: c.validFrom,
          validUntil: c.validUntil,
          usageLimit: c.usageLimit,
        },
      }),
    ),
  );
  const activeCoupons = coupons.filter((c) => c.active && (!c.validUntil || c.validUntil > now));

  const equipmentList = await Promise.all(
    spec.equipment.map((e) => prisma.equipment.create({ data: { ownerId: owner.id, name: e.name, pricePerUnit: e.pricePerUnit } })),
  );

  await Promise.all(
    spec.staff.map((s) =>
      hash(STAFF_PASSWORD).then((pw) =>
        prisma.staffMember.create({ data: { ownerId: owner.id, name: s.name, email: s.email, password: pw, permission: s.permission } }),
      ),
    ),
  );

  for (let ci = 0; ci < spec.courts.length; ci++) {
    const c = spec.courts[ci];
    const isWeekendSport = c.sport === 'Vôlei de Praia';
    const weekdayPrice = 80 + ci * 20;
    const eveningPrice = weekdayPrice + 30;
    const weekendPrice = weekdayPrice + (isWeekendSport ? 40 : 20);

    const court = await prisma.court.create({
      data: {
        ownerId: owner.id,
        name: c.name,
        sport: c.sport,
        surfaceType: c.surfaceType,
        hasLighting: c.hasLighting,
        photoUrls: [`https://picsum.photos/seed/${spec.slug}-${ci}-a/900/600`, `https://picsum.photos/seed/${spec.slug}-${ci}-b/900/600`],
        priceRules: {
          create: [
            { dayOfWeek: 1, startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: weekdayPrice },
            { dayOfWeek: 2, startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: weekdayPrice },
            { dayOfWeek: 3, startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: weekdayPrice },
            { dayOfWeek: 4, startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: weekdayPrice },
            { dayOfWeek: 5, startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: weekdayPrice },
            { dayOfWeek: 1, startMinute: 18 * 60, endMinute: 23 * 60, pricePerHour: eveningPrice },
            { dayOfWeek: 2, startMinute: 18 * 60, endMinute: 23 * 60, pricePerHour: eveningPrice },
            { dayOfWeek: 3, startMinute: 18 * 60, endMinute: 23 * 60, pricePerHour: eveningPrice },
            { dayOfWeek: 4, startMinute: 18 * 60, endMinute: 23 * 60, pricePerHour: eveningPrice },
            { dayOfWeek: 5, startMinute: 18 * 60, endMinute: 23 * 60, pricePerHour: eveningPrice },
            { dayOfWeek: 0, startMinute: 8 * 60, endMinute: 23 * 60, pricePerHour: weekendPrice },
            { dayOfWeek: 6, startMinute: 8 * 60, endMinute: 23 * 60, pricePerHour: weekendPrice },
          ],
        },
      },
    });

    if (ci === 0) {
      await prisma.recurringMaintenanceBlock.create({
        data: { courtId: court.id, dayOfWeek: 1, startMinute: 6 * 60, endMinute: 7 * 60, reason: 'Limpeza semanal' },
      });
      await prisma.maintenanceBlock.create({
        data: {
          courtId: court.id,
          startsAt: dateAt(-20, 7),
          endsAt: dateAt(-20, 11),
          reason: 'Troca de rede/alambrado',
          cost: 350,
          completedAt: dateAt(-20, 11),
        },
      });
      await prisma.maintenanceBlock.create({
        data: { courtId: court.id, startsAt: dateAt(9, 7), endsAt: dateAt(9, 9), reason: 'Manutenção preventiva agendada' },
      });
    }

    await prisma.waitlist.create({
      data: { courtId: court.id, name: 'Marcelo Prado', phone: '11999991111', startsAt: dateAt(1, 19), endsAt: dateAt(1, 20), notifiedAt: dateAt(-1, 10) },
    });
    await prisma.waitlist.create({
      data: { courtId: court.id, name: 'Sandra Melo', phone: '11999992222', startsAt: dateAt(3, 20), endsAt: dateAt(3, 21) },
    });

    await createReservationsForCourt(
      court.id,
      weekdayPrice,
      playersByPhone,
      instructors.map((i) => i.id),
      activeCoupons.map((c) => ({ id: c.id, discountType: c.discountType, discountValue: Number(c.discountValue) })),
      equipmentList.map((e) => ({ id: e.id, name: e.name, pricePerUnit: Number(e.pricePerUnit) })),
    );
  }

  return { owner, staff: spec.staff };
}

async function main() {
  console.log('Seeding jogadores...');
  const playersByPhone = await seedPlayers();

  const credentials: string[] = [];

  for (const spec of ESTABLISHMENTS) {
    console.log(`Seeding estabelecimento: ${spec.slug}...`);
    const { owner, staff } = await seedEstablishment(spec, playersByPhone);
    credentials.push(`- ${spec.slug} | dono: ${owner.email} / ${OWNER_PASSWORD}`);
    for (const s of staff) {
      credentials.push(`    funcionário (${s.permission}): ${s.email} / ${STAFF_PASSWORD}`);
    }
  }

  console.log('\n=== Contas de teste (estabelecimentos) ===');
  console.log(credentials.join('\n'));
  console.log('===========================================\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
