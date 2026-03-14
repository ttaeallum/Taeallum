import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 5 },
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 },
  ],
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

  let res1 = http.get(`${BASE_URL}/api/courses`);
  check(res1, {
    'Courses API status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
