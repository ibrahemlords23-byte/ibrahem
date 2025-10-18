# تعليمات التشغيل السريع مع قاعدة بيانات Neon

## الخطوات السريعة:

### 1. إعداد متغيرات البيئة
```bash
# انسخ ملف البيئة
cp backend/env.example backend/.env

# أو قم بإنشاء ملف .env يدوياً في مجلد backend مع المحتوى التالي:
```

### 2. محتوى ملف backend/.env:
```env
DATABASE_URL="postgresql://neondb_owner:npg_SRoDGZ42qWFp@ep-billowing-band-adhuxspr-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="ibrahim-accounting-super-secret-jwt-key-2024"
JWT_REFRESH_SECRET="ibrahim-accounting-super-secret-refresh-key-2024"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"
TRIAL_DURATION_DAYS=30
TRIAL_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. تثبيت التبعيات
```bash
# تثبيت جميع التبعيات
npm run install:all
```

### 4. إعداد قاعدة البيانات
```bash
# الانتقال إلى مجلد Backend
cd backend

# تشغيل migrations لإنشاء الجداول
npx prisma migrate dev --name init

# إضافة البيانات التجريبية
npx prisma db seed
```

### 5. تشغيل التطبيق
```bash
# العودة إلى المجلد الرئيسي
cd ..

# تشغيل التطبيق
npm run dev
```

### 6. الوصول للتطبيق
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## بيانات تسجيل الدخول:

| اسم المستخدم | كلمة المرور | الدور |
|--------------|-------------|--------|
| ibrahem | sanad97 | مدير النظام |
| iboo2 | pass567 | مدير |
| ahmed | pass123 | مدير |
| sara | sara123 | محاسب |
| ali | ali123 | مستخدم |
| tset | test1 | مستخدم |

## استكشاف الأخطاء:

### إذا واجهت مشكلة في الاتصال بقاعدة البيانات:
1. تأكد من أن رابط قاعدة البيانات صحيح
2. تأكد من أن قاعدة البيانات نشطة على Neon
3. تحقق من إعدادات SSL

### إذا واجهت مشكلة في Prisma:
```bash
# إعادة توليد Prisma Client
cd backend
npx prisma generate

# إعادة تشغيل migrations
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

### إذا واجهت مشكلة في التبعيات:
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## ملاحظات مهمة:

1. **قاعدة البيانات**: تستخدم Neon Cloud PostgreSQL - لا حاجة لتثبيت PostgreSQL محلياً
2. **الأمان**: تم تعيين مفاتيح JWT قوية - يمكن تغييرها في الإنتاج
3. **النسخة التجريبية**: مفعلة لمدة 30 يوم
4. **الصلاحيات**: كل مستخدم له صلاحيات مختلفة حسب دوره

## الدعم:
إذا واجهت أي مشاكل، تأكد من:
- Node.js 18+ مثبت
- الإنترنت متصل (للاتصال بقاعدة البيانات)
- المنافذ 3000 و 3001 متاحة

---

**نظام إبراهيم للمحاسبة** جاهز للاستخدام! 🚀
