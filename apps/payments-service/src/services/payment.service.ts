import prisma from '@mobiwave/prisma';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { mpesaService } from './mpesa.service';
import {
  NotFoundError,
  PaymentError,
  ConflictError,
} from '@mobiwave/shared';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, current) => (
    typeof current === 'bigint' ? current.toString() : current
  ))) as T;
}

function idempotencyCacheKey(tenantId: string, key: string): string {
  return `idempotency:${tenantId}:${key}`;
}

function readMpesaAmountMinor(items?: Array<{ Name: string; Value: unknown }>): bigint | null {
  const amount = items?.find((item) => item.Name === 'Amount')?.Value;
  if (amount === undefined || amount === null) return null;
  return BigInt(Math.round(Number(amount)));
}

export class PaymentService {
  async initiateStkPush(data: {
    bookingId: string;
    phoneNumber: string;
    amountMinor?: string | bigint;
    tenantId: string;
    customerId: string;
    idempotencyKey?: string;
  }) {
    const cacheKey = data.idempotencyKey ? idempotencyCacheKey(data.tenantId, data.idempotencyKey) : null;
    if (cacheKey) {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const booking = await prisma.booking.findFirst({
      where: { id: data.bookingId, tenantId: data.tenantId, deletedAt: null },
    });
    if (!booking) throw new NotFoundError('Booking');
    if (booking.status !== 'AWAITING_PAYMENT') {
      throw new ConflictError(`Cannot initiate payment for booking in status ${booking.status}`);
    }

    const amountMinor = data.amountMinor !== undefined
      ? BigInt(data.amountMinor)
      : booking.totalAmountMinor;

    if (amountMinor !== booking.totalAmountMinor) {
      throw new PaymentError('Payment amount does not match booking total');
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { bookingId: data.bookingId, tenantId: data.tenantId, status: 'INITIATED' },
    });
    if (existingPayment) {
      throw new ConflictError('Payment already initiated for this booking');
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          id: uuidv4(),
          tenantId: data.tenantId,
          bookingId: data.bookingId,
          customerId: data.customerId,
          amountGross: amountMinor,
          amountFee: BigInt(0),
          amountNet: amountMinor,
          currency: booking.currency,
          status: 'INITIATED',
          paymentMethod: 'MPESA_STK',
          metadata: { phone: data.phoneNumber, idempotencyKey: data.idempotencyKey },
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId: data.tenantId,
          channel: 'mpesa_stk',
          eventType: 'payment.stk_push_requested',
          eventKey: created.id,
          payload: {
            paymentId: created.id,
            bookingId: data.bookingId,
            phoneNumber: data.phoneNumber,
            amountMinor: amountMinor.toString(),
          },
        },
      });

      return created;
    });

    try {
      const stkResponse = await mpesaService.initiateStkPush({
        phoneNumber: data.phoneNumber,
        amountMinor,
        accountReference: payment.id,
        transactionDesc: `Payment for booking ${data.bookingId}`,
      });

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
        },
      });

      await redis.setex(
        `mpesa:checkout:${stkResponse.CheckoutRequestID}`,
        IDEMPOTENCY_TTL_SECONDS,
        JSON.stringify({ paymentId: payment.id, bookingId: data.bookingId }),
      );

      const response = jsonSafe({
        paymentId: updated.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        status: updated.status,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      if (cacheKey) {
        await redis.setex(cacheKey, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(response));
      }

      return response;
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', metadata: { error: (error as Error).message } },
      });
      throw error;
    }
  }

  async handleStkCallback(body: unknown) {
    const payload = body as {
      Body?: {
        stkCallback?: {
          MerchantRequestID: string;
          CheckoutRequestID: string;
          ResultCode: number;
          ResultDesc: string;
          CallbackMetadata?: { Item?: Array<{ Name: string; Value: unknown }> };
        };
      };
    };
    const stkCallback = payload.Body?.stkCallback;
    if (!stkCallback) throw new PaymentError('Invalid callback payload');

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    const payment = await prisma.payment.findFirst({
      where: { checkoutRequestId: CheckoutRequestID },
      include: { booking: true },
    });
    if (!payment) {
      return { processed: false, reason: 'Payment not found' };
    }

    if (payment.status === 'SUCCESS') {
      return { processed: true, reason: 'Already processed' };
    }

    if (ResultCode !== 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: { resultCode: ResultCode, resultDesc: ResultDesc },
        },
      });
      await redis.del(`mpesa:checkout:${CheckoutRequestID}`);
      return { processed: true, status: 'FAILED', resultCode: ResultCode, resultDesc: ResultDesc };
    }

    const callbackAmountMinor = readMpesaAmountMinor(CallbackMetadata?.Item);
    if (callbackAmountMinor !== null && callbackAmountMinor !== payment.amountGross) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            resultCode: ResultCode,
            resultDesc: 'Amount mismatch',
            callbackAmountMinor: callbackAmountMinor.toString(),
          },
        },
      });
      return { processed: true, status: 'FAILED', reason: 'Amount mismatch' };
    }

    const metadata = mpesaService.parseCallbackMetadata(CallbackMetadata?.Item || []);

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          merchantRequestId: MerchantRequestID,
          checkoutRequestId: CheckoutRequestID,
          mpesaReceiptNumber: metadata.MpesaReceiptNumber as string,
          mpesaTransactionDate: metadata.TransactionDate
            ? new Date(String(metadata.TransactionDate))
            : new Date(),
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'CONFIRMED',
          version: { increment: 1 },
        },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          tenantId: payment.tenantId,
          paymentId: payment.id,
          userId: payment.customerId,
          type: 'CREDIT',
          amount: payment.amountNet,
          currency: payment.currency,
          description: `Payment received for booking ${payment.bookingId}`,
        },
      });

      await tx.jobEvent.create({
        data: {
          id: uuidv4(),
          tenantId: payment.tenantId,
          bookingId: payment.bookingId,
          entityType: 'BOOKING',
          fromState: payment.booking.status,
          toState: 'CONFIRMED',
          actorId: payment.customerId,
          reason: 'payment.success',
          metadata: { paymentId: payment.id, checkoutRequestId: CheckoutRequestID },
        },
      });

      await tx.outbox.create({
        data: {
          id: uuidv4(),
          tenantId: payment.tenantId,
          channel: 'whatsapp',
          eventType: 'booking.confirmed',
          eventKey: `${payment.bookingId}:payment:${updatedBooking.version}`,
          payload: { bookingId: payment.bookingId, paymentId: payment.id },
        },
      });

      return updatedPayment;
    });

    await redis.del(`mpesa:checkout:${CheckoutRequestID}`);

    return {
      processed: true,
      status: result.status,
      receiptNumber: result.mpesaReceiptNumber,
    };
  }

  async handleB2CCallback(body: unknown) {
    const result = (body as { Result?: Record<string, unknown> }).Result;
    if (!result) throw new PaymentError('Invalid B2C callback payload');

    const resultCode = Number(result.ResultCode);
    return resultCode === 0
      ? { processed: true, status: 'REFUNDED', receiptNumber: result.TransactionReceipt }
      : { processed: true, status: 'REFUND_FAILED', resultCode, resultDesc: result.ResultDesc };
  }

  async getById(id: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundError('Payment');
    return jsonSafe(payment);
  }

  async getStatus(id: string, tenantId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, mpesaReceiptNumber: true, createdAt: true },
    });
    if (!payment) throw new NotFoundError('Payment');
    return jsonSafe(payment);
  }

  async listByBooking(bookingId: string, tenantId: string) {
    const payments = await prisma.payment.findMany({
      where: { bookingId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return jsonSafe(payments);
  }

  async initiateRefund(paymentId: string, tenantId: string, amountMinor: string | bigint) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
    });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status !== 'SUCCESS') throw new ConflictError('Can only refund successful payments');

    const refundAmountMinor = BigInt(amountMinor);
    if (refundAmountMinor <= BigInt(0) || refundAmountMinor > payment.amountNet) {
      throw new PaymentError('Invalid refund amount');
    }

    const b2cResponse = await mpesaService.initiateB2C({
      destinationPhone: (payment.metadata as { phone?: string } | null)?.phone || '',
      amountMinor: refundAmountMinor,
      occasion: 'Refund',
      remarks: `Refund for payment ${paymentId}`,
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUND_PENDING' },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'REFUND_PENDING', version: { increment: 1 } },
      });

      await tx.ledgerEntry.create({
        data: {
          id: uuidv4(),
          tenantId,
          paymentId: payment.id,
          userId: payment.customerId,
          type: 'DEBIT',
          amount: refundAmountMinor,
          currency: payment.currency,
          description: `Refund initiated for payment ${paymentId}`,
        },
      });
    });

    return { refundId: b2cResponse.ConversationID, status: 'REFUND_PENDING' };
  }

  async reconcile() {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'INITIATED',
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
              data: { status: 'SUCCESS' },
            });
            results.push({ paymentId: payment.id, status: 'SUCCESS' });
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
