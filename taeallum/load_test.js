import http from 'k6/http';
import { check, sleep } from 'k6';

// إعدادات الضغط (Load Options)
export const options = {
  stages: [
    // المرحلة الأولى: التدرج إلى 20 مستخدم وهمي خلال 30 ثانية
    { duration: '30s', target: 20 },
    
    // المرحلة الثانية: البقاء على 20 مستخدم لمدة دقيقة واحدة لاختبار استقرار الخادم
    { duration: '1m', target: 20 },
    
    // المرحلة الثالثة: التدرج هبوطاً إلى 0 مستخدم خلال 30 ثانية
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

  // 1. اختبار الصفحة الرئيسية
  let res1 = http.get(`${BASE_URL}/`);
  check(res1, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loaded under 500ms': (r) => r.timings.duration < 500,
  });

  // 2. محاكاة انتظار المستخدم قليلاً قبل النقر على صفحة أخرى (1 ثانية)
  sleep(1);

  // 3. اختبار مسار جلب الدورات الرئيسية (API Courses)
  let res2 = http.get(`${BASE_URL}/api/courses`);
  check(res2, {
    'Courses API status is 200': (r) => r.status === 200,
    'Courses API returned data': (r) => r.body && r.body.length > 0,
  });

  // 4. محاكاة وقت أطول للقراءة قبل إعادة التصفح
  sleep(2);
}
