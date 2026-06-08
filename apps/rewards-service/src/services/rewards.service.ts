import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ConflictError, ValidationError } from '@mobiwave/shared';

export class RewardsService {
  async createReferral(data: { tenantId: string; referrerId: string; referredId: string }) {
    const referred = await prisma.user.findFirst({
      where: { id: data.referredId, tenantId: data.tenantId },
    });
    if (!referred) throw new NotFoundError('User', data.referredId);

    const existing = await prisma.referral.findUnique({
      where: { referrerId_referredId: { referrerId: data.referrerId, referredId: data.referredId } },
    });
    if (existing) throw new ConflictError('Referral already exists');

    const referral = await prisma.referral.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        referrerId: data.referrerId,
        referredId: data.referredId,
        status: 'PENDING',
      },
      include: { referrer: true, referred: true },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        topic: 'referral.created',
        key: referral.id,
        payload: {
          referralId: referral.id,
          referrerId: data.referrerId,
          referredId: data.referredId,
        },
        headers: { eventType: 'referral.created' },
        status: 'PENDING',
      },
    });

    return referral;
  }

  async getPoints(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundError('User', userId);

    const [totalEarned, totalRedeemed, history] = await Promise.all([
      prisma.loyaltyPoint.aggregate({
        where: { userId, tenantId, type: 'EARNED' },
        _sum: { points: true },
      }),
      prisma.loyaltyPoint.aggregate({
        where: { userId, tenantId, type: 'REDEEMED' },
        _sum: { points: true },
      }),
      prisma.loyaltyPoint.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const earned = totalEarned._sum.points || 0;
    const redeemed = totalRedeemed._sum.points || 0;

    return {
      userId,
      earned,
      redeemed,
      balance: earned - redeemed,
      history,
    };
  }

  async redeemPoints(userId: string, tenantId: string, points: number) {
    if (points <= 0) throw new ValidationError('Points must be positive');

    const { balance } = await this.getPoints(userId, tenantId);
    if (points > balance) throw new ValidationError(`Insufficient points. Balance: ${balance}, requested: ${points}`);

    const loyaltyPoint = await prisma.loyaltyPoint.create({
      data: {
        id: uuidv4(),
        tenantId,
        userId,
        points: -points,
        type: 'REDEEMED',
        description: `Redeemed ${points} points`,
      },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId,
        topic: 'points.redeemed',
        key: loyaltyPoint.id,
        payload: { userId, points, balance: balance - points },
        headers: { eventType: 'points.redeemed' },
        status: 'PENDING',
      },
    });

    return { ...loyaltyPoint, points: -points, remainingBalance: balance - points };
  }

  async earnPoints(data: { tenantId: string; userId: string; points: number; bookingId?: string; description?: string }) {
    if (data.points <= 0) throw new ValidationError('Points must be positive');

    const loyaltyPoint = await prisma.loyaltyPoint.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        userId: data.userId,
        points: data.points,
        type: 'EARNED',
        bookingId: data.bookingId,
        description: data.description || `Earned ${data.points} points`,
      },
    });

    await prisma.outbox.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        topic: 'points.earned',
        key: loyaltyPoint.id,
        payload: { userId: data.userId, points: data.points, bookingId: data.bookingId },
        headers: { eventType: 'points.earned' },
        status: 'PENDING',
      },
    });

    return loyaltyPoint;
  }

  async listPromotions(tenantId: string, page = 1, limit = 20) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const promotions = (tenant?.settings as any)?.promotions || [];
    const paginated = promotions.slice((page - 1) * limit, page * limit);
    return { promotions: paginated, total: promotions.length, page, limit, totalPages: Math.ceil(promotions.length / limit) };
  }
}

export const rewardsService = new RewardsService();
