import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import {
  NotFoundError,
  ValidationError,
  BookingConflictError,
  ConflictError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED', 'STALLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: ['CANCELLED'],
  STALLED: ['IN_PROGRESS', 'CANCELLED'],
};

export class AvailabilityService {
  async checkAvailable(
    serviceId: string,
    date: string,
    workerId?: string,
    tenantId?: string,
  ): Promise<Array<{ workerId: string; workerName: string; availableSlots: string[] }>> {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new NotFoundError('Service');

    const scheduledDate = new Date(date);

    const where: any = {
      tenantId: tenantId || service.tenantId,
      isAvailable: true,
      skills: { hasSome: service.requirements.length > 0 ? service.requirements : [] },
    };
    if (workerId) where.userId = workerId;

    const workers = await prisma.workerProfile.findMany({
      where,
      include: { user: true },
    });

    const results: Array<{ workerId: string; workerName: string; availableSlots: string[] }> = [];

    for (const worker of workers) {
      const existingBookings = await prisma.booking.findMany({
        where: {
          workerId: worker.userId,
          scheduledDate,
          status: { in: ['CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
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

          const conflict = existingBookings.some((_, idx) => {
            return slotStart < bookedEnds[idx] && slotEnd > bookedStarts[idx];
          });

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
  }) {
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) throw new NotFoundError('Service');

    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId: data.customerId },
    });
    if (!address) throw new NotFoundError('Address');

    const scheduledDate = new Date(data.scheduledDate);
    const [startHour, startMin] = data.scheduledStart.split(':').map(Number);
    const scheduledStart = new Date(scheduledDate);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + service.durationMinutes);

    const booking = await prisma.booking.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        customerId: data.customerId,
        serviceId: data.serviceId,
        addressId: data.addressId,
        scheduledDate,
        scheduledStart,
        scheduledEnd,
        status: 'PENDING',
        baseAmount: service.basePrice,
        discountAmount: 0,
        totalAmount: service.basePrice,
        currency: 'KES',
        isRecurring: false,
        metadata: data.notes ? JSON.parse(JSON.stringify({ notes: data.notes })) : undefined,
      },
      include: { service: true, address: true },
    });

    return booking;
  }

  async getById(id: string, tenantId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      include: { service: true, address: true, customer: true, worker: true },
    });
    if (!booking) throw new NotFoundError('Booking');
    return booking;
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

    const where: any = { tenantId };
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledDate.lte = new Date(filters.endDate);
    }

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

    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancel(id: string, tenantId: string, userId: string, reason: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!VALID_TRANSITIONS[booking.status]?.includes('CANCELLED')) {
      throw new ConflictError(`Cannot cancel booking in status ${booking.status}`);
    }

    return prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
        cancelledBy: userId,
        cancelledAt: new Date(),
      },
      include: { service: true, address: true },
    });
  }

  async reschedule(id: string, tenantId: string, newDate: string, newStart: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new ConflictError(`Cannot reschedule booking in status ${booking.status}`);
    }

    const service = await prisma.service.findUnique({ where: { id: booking.serviceId } });
    const scheduledDate = new Date(newDate);
    const [startHour, startMin] = newStart.split(':').map(Number);
    const scheduledStart = new Date(scheduledDate);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + (service?.durationMinutes || 120));

    return prisma.booking.update({
      where: { id },
      data: {
        scheduledDate,
        scheduledStart,
        scheduledEnd,
        status: 'PENDING',
      },
      include: { service: true, address: true },
    });
  }

  async confirm(id: string, tenantId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!VALID_TRANSITIONS[booking.status]?.includes('CONFIRMED')) {
      throw new ConflictError(`Cannot confirm booking in status ${booking.status}`);
    }

    return prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { service: true, address: true },
    });
  }

  async complete(id: string, tenantId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!VALID_TRANSITIONS[booking.status]?.includes('COMPLETED')) {
      throw new ConflictError(`Cannot complete booking in status ${booking.status}`);
    }

    return prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { service: true, address: true },
    });
  }

  async assignWorker(bookingId: string, tenantId: string, workerId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    if (!VALID_TRANSITIONS[booking.status]?.includes('ASSIGNED')) {
      throw new ConflictError(`Cannot assign worker to booking in status ${booking.status}`);
    }

    const worker = await prisma.workerProfile.findFirst({
      where: { userId: workerId },
    });
    if (!worker) throw new NotFoundError('Worker');

    const conflict = await prisma.booking.findFirst({
      where: {
        workerId,
        scheduledDate: booking.scheduledDate,
        status: { in: ['CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
        id: { not: bookingId },
      },
    });
    if (conflict) {
      throw new BookingConflictError(workerId, booking.scheduledDate.toISOString());
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { workerId, status: 'ASSIGNED' },
      include: { service: true, address: true, worker: true },
    });
  }
}

export const bookingService = new BookingService();
