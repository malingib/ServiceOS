import prisma from '@mobiwave/prisma';
import { NotFoundError, ConflictError } from '@mobiwave/shared';
import { v4 as uuidv4 } from 'uuid';

export class CustomerService {
  async create(data: {
    userId: string;
    tenantId: string;
    homeAddress?: Record<string, unknown>;
    workAddress?: Record<string, unknown>;
    preferredPaymentMethod?: string;
    referralCode?: string;
  }) {
    const existing = await prisma.customerProfile.findUnique({
      where: { userId: data.userId },
    });
    if (existing) {
      throw new ConflictError('Customer profile already exists for this user');
    }

    let referredBy: string | undefined;
    if (data.referralCode) {
      const referrer = await prisma.customerProfile.findUnique({
        where: { referralCode: data.referralCode },
      });
      if (referrer) {
        referredBy = referrer.userId;
      }
    }

    const referralCode = `CUST${Math.floor(1000 + Math.random() * 9000)}`;

    return prisma.customerProfile.create({
      data: {
        id: uuidv4(),
        userId: data.userId,
        tenantId: data.tenantId,
        homeAddress: data.homeAddress ? JSON.parse(JSON.stringify(data.homeAddress)) : undefined,
        workAddress: data.workAddress ? JSON.parse(JSON.stringify(data.workAddress)) : undefined,
        preferredPaymentMethod: data.preferredPaymentMethod,
        referralCode,
        referredBy,
        loyaltyPoints: 0,
        referralCount: 0,
      },
      include: { user: true },
    });
  }

  async getById(userId: string, tenantId: string) {
    const profile = await prisma.customerProfile.findFirst({
      where: { userId, tenantId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Customer profile');
    return profile;
  }

  async update(userId: string, tenantId: string, data: {
    homeAddress?: Record<string, unknown>;
    workAddress?: Record<string, unknown>;
    preferredPaymentMethod?: string;
  }) {
    const profile = await prisma.customerProfile.findFirst({
      where: { userId, tenantId },
    });
    if (!profile) throw new NotFoundError('Customer profile');

    return prisma.customerProfile.update({
      where: { id: profile.id },
      data: {
        homeAddress: data.homeAddress ? JSON.parse(JSON.stringify(data.homeAddress)) : undefined,
        workAddress: data.workAddress ? JSON.parse(JSON.stringify(data.workAddress)) : undefined,
        preferredPaymentMethod: data.preferredPaymentMethod,
      },
      include: { user: true },
    });
  }

  async list(tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      prisma.customerProfile.findMany({
        where: { tenantId },
        include: { user: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customerProfile.count({ where: { tenantId } }),
    ]);
    return { profiles, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async delete(userId: string, tenantId: string) {
    const profile = await prisma.customerProfile.findFirst({
      where: { userId, tenantId },
    });
    if (!profile) throw new NotFoundError('Customer profile');

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    return { message: 'Customer deleted successfully' };
  }
}

export const customerService = new CustomerService();
