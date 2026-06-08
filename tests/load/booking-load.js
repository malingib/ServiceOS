import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

const bookingCreateRate = new Rate('booking_create_success');
const bookingCreateDuration = new Trend('booking_create_duration');
const totalBookings = new Counter('total_bookings_created');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    booking_create_success: ['rate>0.9'],
    http_req_failed: ['rate<0.1'],
  },
};

function generateId(): string {
  return `${__VU}-${__ITER}-${Date.now()}`;
}

export default function () {
  group('Booking Creation Flow', () => {
    const tenantId = `tenant-${__VU % 5}`;
    const customerId = `customer-${__VU}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token-${__VU}`,
      'X-Tenant-Id': tenantId,
    };

    const payload = JSON.stringify({
      serviceId: `service-${(__VU % 3) + 1}`,
      addressId: `address-${__VU}`,
      scheduledDate: '2025-06-15',
      scheduledStart: `${(8 + (__ITER % 8)).toString().padStart(2, '0')}:00`,
      notes: `Load test booking from VU ${__VU}`,
    });

    const createRes = http.post(`${BASE_URL}/v1/bookings`, payload, { headers });
    bookingCreateDuration.add(createRes.timings.duration);
    const createSuccess = check(createRes, {
      'booking created successfully': (r) => r.status === 201,
      'response has booking id': (r) => r.json('data.id') !== undefined,
      'response has pending status': (r) => r.json('data.status') === 'PENDING',
    });
    bookingCreateRate.add(createSuccess);
    if (createSuccess) totalBookings.add(1);

    if (createSuccess) {
      const bookingId = createRes.json('data.id');

      const getRes = http.get(`${BASE_URL}/v1/bookings/${bookingId}`, { headers });
      check(getRes, {
        'booking retrieval successful': (r) => r.status === 200,
        'retrieved correct booking': (r) => r.json('data.id') === bookingId,
      });
    }

    const listRes = http.get(`${BASE_URL}/v1/bookings?page=1&limit=20`, { headers });
    check(listRes, {
      'booking list retrieved': (r) => r.status === 200,
      'list has pagination': (r) => r.json('meta.pagination') !== undefined,
    });
  });

  sleep(1);
}
