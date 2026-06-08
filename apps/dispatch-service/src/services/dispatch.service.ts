import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import {
  NotFoundError,
  ConflictError,
  BookingConflictError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const VALID_JOB_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: ['EN_ROUTE'],
  EN_ROUTE: ['IN_PROGRESS', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'STALLED'],
  STALLED: ['IN_PROGRESS'],
  COMPLETED: [],
  DECLINED: [],
  NO_SHOW: [],
  CANCELLED: [],
};

const DISTANCE_WEIGHT = 0.4;
const RELIABILITY_WEIGHT = 0.4;
const WORKLOAD_WEIGHT = 0.2;

function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class DispatchService {
  async assignManual(data: {
    bookingId: string;
    workerId: string;
    tenantId: string;
  }) {
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, tenantId: data.tenantId },
      include: { service: true },
    });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError(`Cannot assign worker to booking in status ${booking.status}`);
    }

    const worker = await prisma.workerProfile.findFirst({
      where: { userId: data.workerId, tenantId: data.tenantId },
    });
    if (!worker) throw new NotFoundError('Worker');
    if (!worker.isAvailable) {
      throw new ConflictError('Worker is not available');
    }

    const conflict = await prisma.booking.findFirst({
      where: {
        workerId: data.workerId,
        tenantId: data.tenantId,
        scheduledDate: booking.scheduledDate,
        status: { in: ['CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
        deletedAt: null,
        id: { not: data.bookingId },
      },
    });
    if (conflict) {
      throw new BookingConflictError(data.workerId, booking.scheduledDate.toISOString());
    }

    const { job } = await prisma.$transaction(async (tx) => {
      const createdJob = await tx.job.create({
        data: {
          id: uuidv4(),
          tenantId: data.tenantId,
          bookingId: data.bookingId,
          workerId: data.workerId,
          serviceId: booking.serviceId,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: data.bookingId },
        data: { workerId: data.workerId, status: 'ASSIGNED', version: { increment: 1 } },
      });

      await tx.jobEvent.createMany({
        data: [
          {
            id: uuidv4(),
            tenantId: data.tenantId,
            bookingId: data.bookingId,
            entityType: 'BOOKING',
            fromState: booking.status,
            toState: 'ASSIGNED',
            reason: 'worker.assigned',
            metadata: { workerId: data.workerId, jobId: createdJob.id },
          },
          {
            id: uuidv4(),
            tenantId: data.tenantId,
            bookingId: data.bookingId,
            jobId: createdJob.id,
            entityType: 'JOB',
            fromState: 'PENDING',
            toState: 'ASSIGNED',
            reason: 'worker.assigned',
            metadata: { workerId: data.workerId },
          },
        ],
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId: data.tenantId,
          channel: 'whatsapp',
          eventType: 'job.assigned',
          eventKey: `${createdJob.id}:assigned`,
          payload: { bookingId: data.bookingId, jobId: createdJob.id, workerId: data.workerId },
        },
      });

      return { job: createdJob, booking: updatedBooking };
    });

    return { job, booking: { id: booking.id, status: 'ASSIGNED', workerId: data.workerId } };
  }

  async autoAssign(data: { bookingId: string; tenantId: string }) {
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, tenantId: data.tenantId },
      include: { service: true, address: true },
    });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.status !== 'CONFIRMED') {
      throw new ConflictError(`Cannot auto-assign worker to booking in status ${booking.status}`);
    }

    const availableWorkers = await prisma.workerProfile.findMany({
      where: {
        tenantId: data.tenantId,
        isAvailable: true,
        kycStatus: 'VERIFIED',
      },
      include: { user: true },
    });

    if (availableWorkers.length === 0) {
      throw new ConflictError('No available workers for assignment');
    }

    const bookedWorkerIds = (
      await prisma.booking.findMany({
        where: {
          scheduledDate: booking.scheduledDate,
          tenantId: data.tenantId,
          deletedAt: null,
          status: { in: ['CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
          workerId: { not: null },
        },
        select: { workerId: true },
      })
    ).map((b) => b.workerId);

    const eligibleWorkers = availableWorkers.filter(
      (w) => !bookedWorkerIds.includes(w.userId),
    );

    if (eligibleWorkers.length === 0) {
      throw new ConflictError('All available workers are booked for this time slot');
    }

    let bestWorker = eligibleWorkers[0];
    let bestScore = -1;

    for (const worker of eligibleWorkers) {
      let distanceScore = 1;
      if (
        worker.currentLocation &&
        booking.address &&
        (booking.address as any).location
      ) {
        const wLoc = worker.currentLocation as { lat: number; lng: number };
        const bLoc = (booking.address as any).location;
        const distance = calculateDistance(wLoc.lat, wLoc.lng, bLoc.lat, bLoc.lng);
        distanceScore = Math.max(0, 1 - distance / 15);
      }

      const reliabilityScore = Number(worker.reliabilityScore) / 500;

      const jobsToday = await prisma.job.count({
        where: {
          workerId: worker.userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      });
      const workloadScore = 1 / (jobsToday + 1);

      const totalScore =
        distanceScore * DISTANCE_WEIGHT +
        reliabilityScore * RELIABILITY_WEIGHT +
        workloadScore * WORKLOAD_WEIGHT;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestWorker = worker;
      }
    }

    return this.assignManual({
      bookingId: data.bookingId,
      workerId: bestWorker.userId,
      tenantId: data.tenantId,
    });
  }

  async updateJobState(jobId: string, tenantId: string, newState: string, location?: { lat: number; lng: number }) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });
    if (!job) throw new NotFoundError('Job');

    const allowed = VALID_JOB_TRANSITIONS[job.status];
    if (!allowed || !allowed.includes(newState)) {
      throw new ConflictError(`Cannot transition job from ${job.status} to ${newState}`);
    }

    const updateData: any = { status: newState };
    let bookingStatus: string | null = null;

    switch (newState) {
      case 'ACCEPTED':
        updateData.acceptedAt = new Date();
        break;
      case 'EN_ROUTE':
        updateData.enRouteAt = new Date();
        break;
      case 'IN_PROGRESS':
        updateData.startedAt = new Date();
        if (location) updateData.startedLocation = JSON.parse(JSON.stringify(location));
        bookingStatus = 'IN_PROGRESS';
        break;
      case 'COMPLETED':
        updateData.completedAt = new Date();
        if (location) updateData.completedLocation = JSON.parse(JSON.stringify(location));
        bookingStatus = 'COMPLETED';
        break;
      case 'NO_SHOW':
        updateData.noShowAt = new Date();
        bookingStatus = 'CONFIRMED';
        break;
      case 'DECLINED':
        bookingStatus = 'CONFIRMED';
        break;
      case 'STALLED':
        bookingStatus = 'STALLED';
        break;
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      const changedJob = await tx.job.update({
        where: { id: jobId },
        data: updateData,
      });

      if (bookingStatus) {
        await tx.booking.update({
          where: { id: job.bookingId },
          data: {
            status: bookingStatus,
            version: { increment: 1 },
            ...(bookingStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
          },
        });
      }

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId,
          bookingId: job.bookingId,
          jobId,
          entityType: 'JOB',
          fromState: job.status,
          toState: newState,
          reason: 'job.transition',
          metadata: location ? { location } : undefined,
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId,
          channel: 'in_app',
          eventType: `job.${newState.toLowerCase()}`,
          eventKey: `${jobId}:${newState}:${Date.now()}`,
          payload: { bookingId: job.bookingId, jobId, status: newState },
        },
      });

      return changedJob;
    });

    return updatedJob;
  }

  async getWorkerJobs(workerId: string, tenantId: string, status?: string) {
    const where: any = { workerId, tenantId };
    if (status) where.status = status;

    return prisma.job.findMany({
      where,
      include: {
        booking: { include: { service: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listJobs(tenantId: string, filters: { status?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const where: any = { tenantId };
    if (filters.status) where.status = filters.status;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { booking: { include: { service: true } }, worker: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const dispatchService = new DispatchService();
