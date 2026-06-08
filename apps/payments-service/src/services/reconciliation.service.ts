import prisma from '@mobiwave/prisma';
import { logger } from '@mobiwave/shared';

export class ReconciliationService {
  async runNightlyReconciliation(): Promise<{
    totalChecked: number;
    completed: number;
    failed: number;
    pending: number;
    errors: Array<{ paymentId: string; error: string }>;
  }> {
    logger.info('Starting nightly reconciliation');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        createdAt: { gte: yesterday },
      },
    });

    let completed = 0;
    let failed = 0;
    let stillPending = 0;
    const errors: Array<{ paymentId: string; error: string }> = [];

    for (const payment of pendingPayments) {
      try {
        if (payment.checkoutRequestId) {
          const { mpesaService } = await import('./mpesa.service');
          const statusResponse = await mpesaService.queryTransactionStatus(payment.checkoutRequestId);

          if (statusResponse.ResultCode === '0') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED' },
            });
            completed++;
          } else if (
            statusResponse.ResultCode &&
            statusResponse.ResultCode !== '1032' &&
            statusResponse.ResultCode !== '1037'
          ) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'FAILED' },
            });
            failed++;
          } else {
            stillPending++;
          }
        }
      } catch (error) {
        errors.push({ paymentId: payment.id, error: (error as Error).message });
      }
    }

    logger.info({
      totalChecked: pendingPayments.length,
      completed,
      failed,
      pending: stillPending,
      errors: errors.length,
    }, 'Nightly reconciliation completed');

    return {
      totalChecked: pendingPayments.length,
      completed,
      failed,
      pending: stillPending,
      errors,
    };
  }
}

export const reconciliationService = new ReconciliationService();
