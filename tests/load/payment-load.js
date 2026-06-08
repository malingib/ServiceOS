import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

const stkPushRate = new Rate('stk_push_success');
const stkPushDuration = new Trend('stk_push_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    stk_push_success: ['rate>0.85'],
  },
};

const PHONE_NUMBERS = [
  '+254700100200',
  '+254700100201',
  '+254700100202',
  '+254700100203',
  '+254700100204',
  '+254700100205',
  '+254700100206',
  '+254700100207',
  '+254700100208',
  '+254700100209',
];

export default function () {
  group('STK Push Flow', () => {
    const tenantId = `tenant-${__VU % 5}`;
    const phoneNumber = PHONE_NUMBERS[__VU % PHONE_NUMBERS.length];

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token-${__VU}`,
      'X-Tenant-Id': tenantId,
    };

    const payload = JSON.stringify({
      bookingId: `booking-${__VU}-${__ITER}`,
      phoneNumber,
      amount: Math.floor(1000 + Math.random() * 9000),
    });

    const stkRes = http.post(`${BASE_URL}/v1/payments/mpesa/stkpush`, payload, { headers });
    stkPushDuration.add(stkRes.timings.duration);

    const stkSuccess = check(stkRes, {
      'STK push initiated': (r) => r.status === 200,
      'response has checkout request id': (r) => r.json('data.checkoutRequestId') !== undefined,
      'response has processing status': (r) => r.json('data.status') === 'PROCESSING',
    });
    stkPushRate.add(stkSuccess);

    if (stkSuccess) {
      const paymentId = stkRes.json('data.paymentId');
      const paymentHeaders = { ...headers, 'Content-Type': 'application/json' };

      const callbackPayload = JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `MR-${__VU}-${__ITER}`,
            CheckoutRequestID: stkRes.json('data.checkoutRequestId'),
            ResultCode: Math.random() > 0.2 ? 0 : 1032,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'MpesaReceiptNumber', Value: `RCPT-${__VU}-${__ITER}` },
                { Name: 'TransactionDate', Value: '20250610120000' },
                { Name: 'PhoneNumber', Value: phoneNumber },
                { Name: 'Amount', Value: 2500 },
              ],
            },
          },
        },
      });

      const callbackRes = http.post(
        `${BASE_URL}/v1/webhooks/mpesa/callback`,
        callbackPayload,
        { headers: paymentHeaders },
      );

      check(callbackRes, {
        'callback processed': (r) => r.status === 200,
        'callback has processed flag': (r) => r.json('data.processed') === true,
      });

      const statusRes = http.get(`${BASE_URL}/v1/payments/${paymentId}`, { headers: paymentHeaders });
      check(statusRes, {
        'payment status retrievable': (r) => r.status === 200,
      });
    }
  });

  sleep(0.5);
}
