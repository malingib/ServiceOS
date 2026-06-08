import prisma from '@mobiwave/prisma';

export class AnalyticsService {
  async getDashboard(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBookings,
      totalRevenue,
      activeWorkers,
      pendingBookings,
      completedToday,
      cancelledToday,
      totalCustomers,
    ] = await Promise.all([
      prisma.booking.count({ where: { tenantId } }),
      prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS' },
        _sum: { amountNet: true },
      }),
      prisma.workerProfile.count({
        where: { tenantId, isAvailable: true },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'AWAITING_PAYMENT' },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.booking.count({
        where: { tenantId, status: 'CANCELLED', cancelledAt: { gte: today, lt: tomorrow } },
      }),
      prisma.user.count({
        where: { tenantId, role: 'CUSTOMER' },
      }),
    ]).catch(() => [0, { _sum: { amountNet: 0 } }, 0, 0, 0, 0, 0]);

    return {
      totalBookings,
      totalRevenue: typeof totalRevenue === 'number' ? totalRevenue : Number(totalRevenue._sum.amountNet || 0),
      activeWorkers,
      pendingBookings,
      completedToday,
      cancelledToday,
      totalCustomers,
    };
  }

  async getBookings(tenantId: string, query: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const where: any = { tenantId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const groupBy = query.groupBy || 'day';
    const grouped = this.groupByTime(bookings, groupBy, 'createdAt');

    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
    });

    return {
      total: bookings.length,
      timeline: grouped,
      byStatus: statusCounts.map(s => ({ status: s.status, count: s._count.id })),
    };
  }

  async getRevenue(tenantId: string, query: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const where: any = { tenantId, status: 'COMPLETED' };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const groupBy = query.groupBy || 'day';
    const grouped = this.groupByTime(payments, groupBy, 'createdAt', (items) =>
      items.reduce((sum, p) => sum + Number(p.amountNet), 0),
    );

    const totals = await prisma.payment.aggregate({
      where: { tenantId, status: 'COMPLETED' },
      _sum: { amountGross: true, amountFee: true, amountNet: true },
      _count: { id: true },
    });

    return {
      totalRevenue: Number(totals._sum.amountNet || 0),
      totalGross: Number(totals._sum.amountGross || 0),
      totalFees: Number(totals._sum.amountFee || 0),
      transactionCount: totals._count.id,
      timeline: grouped,
    };
  }

  async getWorkers(tenantId: string) {
    const [totalWorkers, activeWorkers, workerStats] = await Promise.all([
      prisma.workerProfile.count({ where: { tenantId } }),
      prisma.workerProfile.count({ where: { tenantId, isAvailable: true } }),
      prisma.job.groupBy({
        by: ['workerId'],
        where: { tenantId },
        _count: { id: true },
        _avg: { customerRating: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const topPerformers = await Promise.all(
      workerStats.slice(0, 10).map(async (stat) => {
        const worker = await prisma.user.findUnique({
          where: { id: stat.workerId },
          select: { id: true, firstName: true, lastName: true },
        });
        return {
          workerId: stat.workerId,
          name: worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown',
          totalJobs: stat._count.id,
          avgRating: stat._avg.customerRating ? Number(stat._avg.customerRating.toFixed(1)) : null,
        };
      }),
    );

    return {
      totalWorkers,
      activeWorkers,
      topPerformers,
    };
  }

  private groupByTime<T extends Record<string, any>>(
    items: T[],
    groupBy: string,
    dateField: string,
    valueFn?: (items: T[]) => number,
  ): Array<{ period: string; count: number; value?: number }> {
    const grouped: Record<string, T[]> = {};

    for (const item of items) {
      const date = new Date(item[dateField]);
      let key: string;

      switch (groupBy) {
        case 'week': {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().slice(0, 10);
          break;
        }
        case 'month':
          key = date.toISOString().slice(0, 7);
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, items]) => ({
        period,
        count: items.length,
        ...(valueFn ? { value: valueFn(items) } : {}),
      }));
  }
}

export const analyticsService = new AnalyticsService();
