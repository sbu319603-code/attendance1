// 🔴 هام جداً: في كل مرة تقوم فيها بتعديل كود index.html مستقبلاً،
// يجب عليك تغيير هذا الرقم (مثلاً من v2 إلى v3 ثم v4) لكي تجبر هواتف الموظفين على التحديث.
const CACHE_NAME = 'attendance-app-v2'; 

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// 1. حدث التثبيت: تخزين الملفات الأساسية لتعمل الواجهة بدون إنترنت
self.addEventListener('install', (event) => {
  // إجبار المتصفح على تثبيت وتفعيل النسخة الجديدة فوراً دون انتظار إغلاق التطبيق
  self.skipWaiting(); 
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. حدث التفعيل: تنظيف الذاكرة ومسح أي كاش يحمل إصداراً قديماً (مثل v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // السيطرة على جميع النوافذ المفتوحة للتطبيق لتطبيق التحديث فوراً
      return self.clients.claim(); 
    })
  );
});

// 3. حدث جلب البيانات (الشبكة): اعتراض الطلبات لتسريع التطبيق وحماية السيرفر
self.addEventListener('fetch', (event) => {
  // تجاوز الكاش كلياً لطلبات POST وطلبات السيرفر (Google Apps Script) 
  // لضمان وصول حركات الحضور والانصراف اللحظية للإنترنت دائماً
  if (event.request.method !== 'GET' || event.request.url.includes('script.google.com')) {
    return; 
  }

  // بالنسبة لباقي الملفات (HTML, الصور)، حاول جلبها من الكاش أولاً لتوفير البيانات والوقت
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // يمكن هنا إضافة صفحة خطأ مخصصة في حال انقطاع الإنترنت كلياً أثناء تحميل ملف غير مخزن
        console.log('Network request failed and no cache available for:', event.request.url);
      });
    })
  );
});
