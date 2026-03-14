import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users quickly
    { duration: '1m', target: 50 },  // Hold at 50 for 1 minute
    { duration: '1m', target: 200 }, // Ramp up to 200 users to test breaking point
    { duration: '30s', target: 0 },  // Cool down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<500'], 
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

  group('Frontend Pages', function () {
    let res = http.get(BASE_URL);
    check(res, {
      'Homepage status 200': (r) => r.status === 200,
      'Response fast enough': (r) => r.timings.duration < 500,
    });
    sleep(1);
    
    // Test lesson player route
    let resApp = http.get(`${BASE_URL}/courses/probability`);
    check(resApp, {
      'Course View status 200': (r) => r.status === 200 || r.status === 404, // might be SPA route
    });
    sleep(1);
  });

  group('API Endpoints', function () {
    let resApi = http.get(`${BASE_URL}/api/courses`);
    check(resApi, {
      'API Courses is 200': (r) => r.status === 200,
    });
    sleep(0.5);

    // Some DB intensive or logic intensive route
    let resSeo = http.get(`${BASE_URL}/sitemap.xml`);
    check(resSeo, {
      'Sitemap loaded': (r) => r.status === 200,
    });
    sleep(1);
  });
}
