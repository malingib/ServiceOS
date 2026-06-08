import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

const assignRate = new Rate('dispatch_assign_success');
const assignDuration = new Trend('dispatch_assign_duration');

export const options = {
  stages: [
    { duration: '30s', target: 15 },
    { duration: '1m', target: 40 },
    { duration: '30s', target: 60 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<4000'],
    dispatch_assign_success: ['rate>0.85'],
  },
};

const JOB_STATES = [
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
];

export default function () {
  group('Dispatch Flow', () => {
    const tenantId = `tenant-${__VU % 5}`;
    const bookingId = `booking-dispatch-${__VU}-${__ITER}`;
    const workerId = `worker-${__VU}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer dispatch-token-${__VU}`,
      'X-Tenant-Id': tenantId,
    };

    const assignPayload = JSON.stringify({
      bookingId,
      workerId,
    });

    const assignRes = http.post(`${BASE_URL}/v1/dispatch/assign`, assignPayload, { headers });
    assignDuration.add(assignRes.timings.duration);

    const assignSuccess = check(assignRes, {
      'worker assigned successfully': (r) => r.status === 200,
      'job created with assigned status': (r) => r.json('data.job.status') === 'ASSIGNED',
      'booking updated to assigned': (r) => r.json('data.booking.status') === 'ASSIGNED',
    });
    assignRate.add(assignSuccess);

    if (assignSuccess) {
      const jobId = assignRes.json('data.job.id');

      let currentState = 'ACCEPTED';
      for (const targetState of JOB_STATES) {
        const statePayload = JSON.stringify({ state: targetState });

        const stateRes = http.patch(
          `${BASE_URL}/v1/dispatch/jobs/${jobId}/state`,
          statePayload,
          { headers },
        );

        const transitionSuccess = check(stateRes, {
          [`job transition to ${targetState} successful`]: (r) => r.status === 200,
          [`job state is ${targetState}`]: (r) => r.json('data.status') === targetState,
        });

        if (!transitionSuccess) {
          currentState = targetState;
          break;
        }
        currentState = targetState;

        const heartbeatPayload = JSON.stringify({
          location: { lat: -1.2921 + (Math.random() - 0.5) * 0.1, lng: 36.8219 + (Math.random() - 0.5) * 0.1 },
        });

        http.post(
          `${BASE_URL}/v1/dispatch/heartbeat`,
          heartbeatPayload,
          { headers },
        );
      }

      const workerJobsRes = http.get(`${BASE_URL}/v1/dispatch/workers/${workerId}/jobs`, { headers });
      check(workerJobsRes, {
        'worker jobs retrieved': (r) => r.status === 200,
      });
    }

    const listRes = http.get(`${BASE_URL}/v1/dispatch/jobs?page=1&limit=20`, { headers });
    check(listRes, {
      'job list retrieved': (r) => r.status === 200,
    });
  });

  sleep(0.5);
}
