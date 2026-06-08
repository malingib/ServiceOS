import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { mpesaService } from './mpesa.service';
import {
  NotFoundError,
  PaymentError,
  MpesaError,
  ConflictError,
  IdempotencyError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const IDEMPOTENCY_TTL = 86400;

export class PaymentService {
  async initiateStkPush(data: {
    bookingId: string;
    phoneNumber: string;
    amount: number;
    tenantId: string;
    customerId: string;
  }) {
    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, tenantId: data.tenantId },
    });
    if (!booking) throw new NotFoundError('Booking');

    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId: data.bookingId, status: { in: ['PENDING', 'PROCESSING'] } },
    });
    if (existingPayment) {
      throw new ConflictError('Payment already in progress for this booking');
    }

    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        tenantId: data.tenantId,
        bookingId: data.bookingId,
        customerId: data.customerId,
        amountGross: BigInt(Math.round(data.amount * 100)),
        amountFee: BigInt(0),
        amountNet: BigInt(Math.round(data.amount * 100)),
        currency: 'KES',
        status: 'PENDING',
        paymentMethod: 'MPESA_STK',
      },
    });

    try {
      const stkResponse = await mpesaService.initiateStkPush({
        phoneNumber: data.phoneNumber,
        amount: data.amount,
        accountReference: payment.id,
        transactionDesc: `Payment for booking ${data.bookingId}`,
      });

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          status: 'PROCESSING',
        },
      });

      await redis.setex(
        `mpesa:checkout:${stkResponse.CheckoutRequestID}`,
        IDEMPOTENCY_TTL,
        JSON.stringify({ paymentId: payment.id, bookingId: data.bookingId }),
      );

      return {
        paymentId: updated.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: 'PROCESSING',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', metadata: JSON.parse(JSON.stringify({ error: (error as Error).message })) },
      });
      throw error;
    }
  }

  async handleStkCallback(body: any) {
    const stkCallback = body.Body?.stkCallback;
    if (!stkCallback) {
      throw new PaymentError('Invalid callback payload');
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const cached = await redis.get(`mpesa:checkout:${CheckoutRequestID}`);
    if (!cached) {
      return { processed: false, reason: 'No pending payment found' };
    }

    const { paymentId, bookingId } = JSON.parse(cached);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      return { processed: false, reason: 'Payment not found' };
    }

    if (payment.status === 'COMPLETED') {
      return { processed: true, reason: 'Already processed' };
    }

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const metadata = mpesaService.parseCallbackMetadata(CallbackMetadata.Item);

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNumber: metadata.MpesaReceiptNumber as string,
          mpesaTransactionDate: metadata.TransactionDate
            ? new Date(String(metadata.TransactionDate))
            : new Date(),
        },
      });

      await prisma.ledgerEntry.create({
        data: {
          id: uuidv4(),
          tenantId: payment.tenantId,
          paymentId: payment.id,
          userId: payment.customerId,
          type: 'CREDIT',
          amount: payment.amountNet,
          currency: payment.currency,
          description: `Payment received for booking ${bookingId}`,
        },
      });

      await redis.del(`mpesa:checkout:${CheckoutRequestID}`);

      return { processed: true, status: 'COMPLETED', receiptNumber: metadata.MpesaReceiptNumber };
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          metadata: JSON.parse(JSON.stringify({ resultCode: ResultCode, resultDesc: ResultDesc })),
        },
      });

      await redis.del(`mpesa:checkout:${CheckoutRequestID}`);

      return { processed: true, status: 'FAILED', resultCode: ResultCode, resultDesc: ResultDesc };
    }
  }

  async handleB2CCallback(body: any) {
    const result = body.Result;
    if (!result) {
      throw new PaymentError('Invalid B2C callback payload');
    }

    const { ResultCode, ResultDesc, ConversationID, TransactionID, TransactionReceipt } = result;

    if (ResultCode === 0) {
      return { processed: true, status: 'COMPLETED', receiptNumber: TransactionReceipt };
    } else {
      return { processed: true, status: 'FAILED', resultCode: ResultCode, resultDesc: ResultDesc };
    }
  }

  async getById(id: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }

  async getStatus(id: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, mpesaReceiptNumber: true, createdAt: true },
    });
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status === 'PROCESSING' && payment.mpesaReceiptNumber) {
      return { ...payment, status: 'COMPLETED' };
    }

    return payment;
  }

  async listByBooking(bookingId: string, tenantId: string) {
    return prisma.payment.findMany({
      where: { bookingId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async initiateRefund(paymentId: string, tenantId: string, amount: number) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
    });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status !== 'COMPLETED') throw new ConflictError('Can only refund completed payments');

    const b2cResponse = await mpesaService.initiateB2C({
      destinationPhone: (payment.metadata as any)?.phone || '',
      amount,
      occasion: 'Refund',
      remarks: `Refund for payment ${paymentId}`,
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUND_PENDING' },
    });

    await prisma.ledgerEntry.create({
      data: {
        id: uuidv4(),
        tenantId,
        paymentId: payment.id,
        userId: payment.customerId,
        type: 'DEBIT',
        amount: BigInt(Math.round(amount * 100)),
        currency: payment.currency,
        description: `Refund initiated for payment ${paymentId}`,
      },
    });

    return { refundId: b2cResponse.ConversationID, status: 'REFUND_PENDING' };
  }

  async reconcile() {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PROCESSING',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const results: Array<{ paymentId: string; status: string; error?: string }> = [];

    for (const payment of pendingPayments) {
      try {
        if (payment.checkoutRequestId) {
          const statusResponse = await mpesaService.queryTransactionStatus(payment.checkoutRequestId);

          if (statusResponse.ResultCode === '0') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'COMPLETED' },
            });
            results.push({ paymentId: payment.id, status: 'COMPLETED' });
          } else if (statusResponse.ResultCode && statusResponse.ResultCode !== '1032') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'FAILED' },
            });
            results.push({ paymentId: payment.id, status: 'FAILED' });
          }
        }
      } catch (error) {
        results.push({ paymentId: payment.id, status: 'ERROR', error: (error as Error).message });
      }
    }

    return { reconciled: results.length, results };
  }
}

export const paymentService = new PaymentService();
