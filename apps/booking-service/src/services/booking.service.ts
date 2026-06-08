import prisma, { Prisma } from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import {
  NotFoundError,
  BookingConflictError,
  ConflictError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

const BOOKING_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED', 'REFUND_FAILED'],
  CONFIRMED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED', 'REFUND_PENDING'],
  ASSIGNED: ['CONFIRMED'],
  IN_PROGRESS: ['COMPLETED', 'STALLED'],
  STALLED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['REVIEWED', 'DISPUTED'],
  DISPUTED: ['RESOLVED'],
  REFUND_PENDING: ['CANCELLED'],
  CANCELLED: [],
  REVIEWED: [],
  RESOLVED: [],
  REFUND_FAILED: [],
};

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, current) => (
    typeof current === 'bigint' ? current.toString() : current
  ))) as T;
}

function assertBookingTransition(from: string, to: string): void {
  if (!BOOKING_TRANSITIONS[from]?.includes(to)) {
    throw new ConflictError(`Cannot transition booking from ${from} to ${to}`);
  }
}

function idempotencyCacheKey(tenantId: string, key: string): string {
  return `idempotency:${tenantId}:${key}`;
}

export class AvailabilityService {
  async checkAvailable(
    serviceId: string,
    date: string,
    workerId?: string,
    tenantId?: string,
  ): Promise<Array<{ workerId: string; workerName: string; availableSlots: string[] }>> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, ...(tenantId ? { tenantId } : {}) },
    });
    if (!service) throw new NotFoundError('Service');

    const scheduledDate = new Date(date);

    const where = {
      tenantId: tenantId || service.tenantId,
      isAvailable: true,
      skills: { hasSome: service.requirements.length > 0 ? service.requirements : [] },
      ...(workerId ? { userId: workerId } : {}),
    };

    const workers = await prisma.workerProfile.findMany({
      where,
      include: { user: true },
    });

    const results: Array<{ workerId: string; workerName: string; availableSlots: string[] }> = [];

    for (const worker of workers) {
      const existingBookings = await prisma.booking.findMany({
        where: {
          tenantId: worker.tenantId,
          workerId: worker.userId,
          scheduledDate,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] },
        },
      });

      const bookedStarts = existingBookings.map((b) => {
        const start = new Date(b.scheduledStart);
        return start.getHours() * 60 + start.getMinutes();
      });

      const bookedEnds = existingBookings.map((b) => {
        const end = new Date(b.scheduledEnd);
        return end.getHours() * 60 + end.getMinutes();
      });

      const allSlots: string[] = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let min = 0; min < 60; min += service.durationMinutes) {
          const slotStart = hour * 60 + min;
          const slotEnd = slotStart + service.durationMinutes;

          if (slotEnd > 18 * 60) continue;

          const conflict = existingBookings.some((_, idx) => (
            slotStart < bookedEnds[idx] && slotEnd > bookedStarts[idx]
          ));

          if (!conflict) {
            const hh = String(hour).padStart(2, '0');
            const mm = String(min).padStart(2, '0');
            allSlots.push(`${hh}:${mm}`);
          }
        }
      }

      if (allSlots.length > 0) {
        results.push({
          workerId: worker.userId,
          workerName: `${worker.user.firstName} ${worker.user.lastName}`,
          availableSlots: allSlots,
        });
      }
    }

    return results;
  }
}

export const availabilityService = new AvailabilityService();

export class BookingService {
  async create(data: {
    tenantId: string;
    customerId: string;
    serviceId: string;
    addressId: string;
    scheduledDate: string;
    scheduledStart: string;
    notes?: string;
    idempotencyKey?: string;
  }) {
    const cacheKey = data.idempotencyKey ? idempotencyCacheKey(data.tenantId, data.idempotencyKey) : null;
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const service = await prisma.service.findFirst({
      where: { id: data.serviceId, tenantId: data.tenantId, deletedAt: null, isActive: true },
    });
    if (!service) throw new NotFoundError('Service');

    const address = await prisma.address.findFirst({
      where: { id: data.addressId, tenantId: data.tenantId, userId: data.customerId },
    });
    if (!address) throw new NotFoundError('Address');

    const scheduledDate = new Date(data.scheduledDate);
    const [startHour, startMin] = data.scheduledStart.split(':').map(Number);
    const scheduledStart = new Date(scheduledDate);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + service.durationMinutes);
    const bookingId = uuidv4();

    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          id: bookingId,
          tenantId: data.tenantId,
          customerId: data.customerId,
          serviceId: data.serviceId,
          addressId: data.addressId,
          scheduledDate,
          scheduledStart,
          scheduledEnd,
          status: 'AWAITING_PAYMENT',
          baseAmountMinor: service.basePriceMinor,
          discountAmountMinor: BigInt(0),
          totalAmountMinor: service.basePriceMinor,
          currency: service.tenantId ? 'KES' : 'KES',
          isRecurring: false,
          version: 1,
          metadata: data.notes ? JSON.parse(JSON.stringify({ notes: data.notes })) : undefined,
        },
        include: { service: true, address: true },
      });

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId: data.tenantId,
          bookingId,
          entityType: 'BOOKING',
          fromState: 'DRAFT',
          toState: 'AWAITING_PAYMENT',
          actorId: data.customerId,
          reason: 'booking.created',
        },
      });

      await tx.outbox.createMany({
        data: [
          {
            id: uuidv4(),
            tenantId: data.tenantId,
            channel: 'in_app',
            eventType: 'booking.created',
            eventKey: bookingId,
            payload: { bookingId, customerId: data.customerId },
          },
          {
            id: uuidv4(),
            tenantId: data.tenantId,
            channel: 'mpesa_stk',
            eventType: 'booking.payment_request',
            eventKey: bookingId,
            payload: {
              bookingId,
              customerId: data.customerId,
              amountMinor: service.basePriceMinor.toString(),
              currency: 'KES',
            },
          },
        ],
      });

      return created;
    });

    const safeBooking = jsonSafe(booking);
    if (cacheKey) {
      await redis.setex(cacheKey, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(safeBooking));
    }
    return safeBooking;
  }

  async getById(id: string, tenantId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { service: true, address: true, customer: true, worker: true },
    });
    if (!booking) throw new NotFoundError('Booking');
    return jsonSafe(booking);
  }

  async list(tenantId: string, filters: {
    customerId?: string;
    workerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.workerId ? { workerId: filters.workerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...((filters.startDate || filters.endDate)
        ? {
            scheduledDate: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: true, address: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings: jsonSafe(bookings), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async transition(
    id: string,
    tenantId: string,
    toState: string,
    actorId: string | null,
    reason: string,
    metadata?: Record<string, unknown>,
  ) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!booking) throw new NotFoundError('Booking');

      assertBookingTransition(booking.status, toState);

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: toState,
          version: { increment: 1 },
          ...(toState === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
        include: { service: true, address: true },
      });

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId,
          bookingId: id,
          entityType: 'BOOKING',
          fromState: booking.status,
          toState,
          actorId: actorId || undefined,
          reason,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId,
          channel: 'in_app',
          eventType: `booking.${toState.toLowerCase()}`,
          eventKey: `${id}:${toState}:${updated.version}`,
          payload: { bookingId: id, status: toState, reason },
        },
      });

      return jsonSafe(updated);
    });
  }

  async cancel(id: string, tenantId: string, userId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!booking) throw new NotFoundError('Booking');

      assertBookingTransition(booking.status, 'CANCELLED');

      const updated = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledBy: userId,
          cancelledAt: new Date(),
          version: { increment: 1 },
        },
        include: { service: true, address: true },
      });

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId,
          bookingId: id,
          entityType: 'BOOKING',
          fromState: booking.status,
          toState: 'CANCELLED',
          actorId: userId,
          reason,
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId,
          channel: 'in_app',
          eventType: 'booking.cancelled',
          eventKey: `${id}:cancelled:${updated.version}`,
          payload: { bookingId: id, reason },
        },
      });

      return jsonSafe(updated);
    });
  }

  async reschedule(id: string, tenantId: string, newDate: string, newStart: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!['DRAFT', 'AWAITING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
      throw new ConflictError(`Cannot reschedule booking in status ${booking.status}`);
    }

    const service = await prisma.service.findFirst({
      where: { id: booking.serviceId, tenantId },
    });
    if (!service) throw new NotFoundError('Service');

    const scheduledDate = new Date(newDate);
    const [startHour, startMin] = newStart.split(':').map(Number);
    const scheduledStart = new Date(scheduledDate);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + service.durationMinutes);

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        scheduledDate,
        scheduledStart,
        scheduledEnd,
        version: { increment: 1 },
      },
      include: { service: true, address: true },
    });

    return jsonSafe(updated);
  }

  async confirm(id: string, tenantId: string, actorId?: string) {
    return this.transition(id, tenantId, 'CONFIRMED', actorId || null, 'booking.confirmed');
  }

  async complete(id: string, tenantId: string, actorId?: string) {
    return this.transition(id, tenantId, 'COMPLETED', actorId || null, 'booking.completed');
  }

  async assignWorker(bookingId: string, tenantId: string, workerId: string, actorId?: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, tenantId, deletedAt: null },
      });
      if (!booking) throw new NotFoundError('Booking');

      assertBookingTransition(booking.status, 'ASSIGNED');

      const worker = await tx.workerProfile.findFirst({
        where: { userId: workerId, tenantId },
      });
      if (!worker) throw new NotFoundError('Worker');

      const conflict = await tx.booking.findFirst({
        where: {
          tenantId,
          workerId,
          scheduledDate: booking.scheduledDate,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] },
          id: { not: bookingId },
        },
      });
      if (conflict) {
        throw new BookingConflictError(workerId, booking.scheduledDate.toISOString());
      }

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { workerId, status: 'ASSIGNED', version: { increment: 1 } },
        include: { service: true, address: true, worker: true },
      });

      await tx.job.create({
        data: {
          id: uuidv4(),
          tenantId,
          bookingId,
          workerId,
          serviceId: booking.serviceId,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
      });

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId,
          bookingId,
          entityType: 'BOOKING',
          fromState: booking.status,
          toState: 'ASSIGNED',
          actorId: actorId || undefined,
          reason: 'booking.assigned',
          metadata: { workerId },
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId,
          channel: 'whatsapp',
          eventType: 'job.assigned',
          eventKey: `${bookingId}:${workerId}`,
          payload: { bookingId, workerId },
        },
      });

      return jsonSafe(updated);
    });
  }
}

export const bookingService = new BookingService();
