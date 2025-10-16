/**
 * k6 Load Testing Script - Phase 8.3
 *
 * Usage:
 *   k6 run load-test.js
 *   k6 run --vus 100 --duration 1m load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export let options = {
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.05'],
  },
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 3000 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000/api';
const PHONE = __ENV.PHONE || '0555123456';
const PASSWORD = __ENV.PASSWORD || '123456789';

const loginTrend = new Trend('login_duration');
const dashboardTrend = new Trend('dashboard_duration');
const sessionsTrend = new Trend('sessions_duration');
const usersTrend = new Trend('users_duration');
const successRate = new Rate('successful_requests');

function login() {
  const deviceUuid = `k6-${__VU}-${Date.now()}`;
  const payload = JSON.stringify({ login: PHONE, password: PASSWORD, device_uuid: deviceUuid });
  const params = { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  loginTrend.add(res.timings.duration);
  check(res, { 'login ok': r => r.status === 200 && r.json('token') }) || successRate.add(false);
  successRate.add(res.status === 200);
  return { token: res.json('token'), deviceUuid };
}

export default function () {
  const { token, deviceUuid } = login();
  const auth = { headers: { Authorization: `Bearer ${token}`, 'X-Device-UUID': deviceUuid, Accept: 'application/json' } };

  group('dashboard', () => {
    const r1 = http.get(`${BASE_URL}/dashboard/data/cards?period=daily`, auth);
    dashboardTrend.add(r1.timings.duration);
    check(r1, { 'cards daily 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r1.status === 200);

    const r2 = http.get(`${BASE_URL}/dashboard/data/top-teachers`, auth);
    dashboardTrend.add(r2.timings.duration);
    check(r2, { 'top teachers 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r2.status === 200);
  });

  group('sessions', () => {
    const r1 = http.get(`${BASE_URL}/sessions?page=1`, auth);
    sessionsTrend.add(r1.timings.duration);
    check(r1, { 'sessions list 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r1.status === 200);

    const r2 = http.get(`${BASE_URL}/sessions?year_target=1AS&status=completed`, auth);
    sessionsTrend.add(r2.timings.duration);
    check(r2, { 'sessions filtered 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r2.status === 200);
  });

  group('users', () => {
    const r1 = http.get(`${BASE_URL}/users?role=student&per_page=50`, auth);
    usersTrend.add(r1.timings.duration);
    check(r1, { 'users list 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r1.status === 200);

    const r2 = http.get(`${BASE_URL}/users?role=student&search=anes`, auth);
    usersTrend.add(r2.timings.duration);
    check(r2, { 'users search 200': r => r.status === 200 }) || successRate.add(false);
    successRate.add(r2.status === 200);
  });

  sleep(1);
}


