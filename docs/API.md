# API Documentation - نظام إبراهيم للمحاسبة

## Base URL
```
http://localhost:3001/api
```

## Authentication
جميع الطلبات تتطلب مصادقة باستخدام JWT Token في Header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/login
تسجيل الدخول

**Request Body:**
```json
{
  "username": "ibrahem",
  "password": "sanad97"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "username": "ibrahem",
      "fullName": "مدير النظام",
      "role": "SUPER_ADMIN",
      "locale": "ar",
      "isTrialActive": true,
      "trialEndDate": "2024-01-18T00:00:00.000Z"
    }
  }
}
```

#### POST /auth/refresh
تحديث الرمز المميز

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث الرمز بنجاح",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/logout
تسجيل الخروج

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### Users Management

#### GET /auth/users
الحصول على قائمة المستخدمين

**Query Parameters:**
- `page` (optional): رقم الصفحة (افتراضي: 1)
- `limit` (optional): عدد العناصر في الصفحة (افتراضي: 10)
- `search` (optional): نص البحث

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "username": "ibrahem",
      "email": "admin@company.com",
      "fullName": "مدير النظام",
      "phone": "770000000",
      "role": "SUPER_ADMIN",
      "locale": "ar",
      "isActive": true,
      "lastLogin": "2024-01-18T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isTrialActive": true,
      "trialEndDate": "2024-01-31T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### GET /auth/users/:id
الحصول على مستخدم محدد

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "ibrahem",
    "email": "admin@company.com",
    "fullName": "مدير النظام",
    "phone": "770000000",
    "role": "SUPER_ADMIN",
    "locale": "ar",
    "isActive": true,
    "lastLogin": "2024-01-18T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-18T10:30:00.000Z",
    "isTrialActive": true,
    "trialStartDate": "2024-01-01T00:00:00.000Z",
    "trialEndDate": "2024-01-31T00:00:00.000Z"
  }
}
```

#### POST /auth/users
إنشاء مستخدم جديد

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "fullName": "مستخدم جديد",
  "phone": "123456789",
  "role": "USER",
  "locale": "ar"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء المستخدم بنجاح",
  "data": {
    "id": "new_user_id",
    "username": "newuser",
    "email": "newuser@example.com",
    "fullName": "مستخدم جديد",
    "phone": "123456789",
    "role": "USER",
    "locale": "ar",
    "isActive": true,
    "createdAt": "2024-01-18T10:30:00.000Z",
    "isTrialActive": true,
    "trialEndDate": "2024-02-17T10:30:00.000Z"
  }
}
```

#### PUT /auth/users/:id
تحديث مستخدم

**Request Body:**
```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "fullName": "مستخدم محدث",
  "phone": "987654321",
  "role": "ADMIN",
  "locale": "en",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث المستخدم بنجاح",
  "data": {
    "id": "user_id",
    "username": "updateduser",
    "email": "updated@example.com",
    "fullName": "مستخدم محدث",
    "phone": "987654321",
    "role": "ADMIN",
    "locale": "en",
    "isActive": true,
    "updatedAt": "2024-01-18T10:30:00.000Z"
  }
}
```

#### DELETE /auth/users/:id
حذف مستخدم (إلغاء تفعيل)

**Response:**
```json
{
  "success": true,
  "message": "تم حذف المستخدم بنجاح",
  "data": {
    "id": "user_id",
    "isActive": false
  }
}
```

#### GET /auth/me
الحصول على بيانات المستخدم الحالي

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "ibrahem",
    "email": "admin@company.com",
    "fullName": "مدير النظام",
    "phone": "770000000",
    "role": "SUPER_ADMIN",
    "locale": "ar",
    "isActive": true,
    "lastLogin": "2024-01-18T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-18T10:30:00.000Z",
    "isTrialActive": true,
    "trialStartDate": "2024-01-01T00:00:00.000Z",
    "trialEndDate": "2024-01-31T00:00:00.000Z"
  }
}
```

### Dashboard

#### GET /dashboard
الحصول على إحصائيات لوحة التحكم

**Response:**
```json
{
  "success": true,
  "data": {
    "totalInvoicesIn": 150,
    "totalInvoicesOut": 200,
    "totalInvoicesInAmount": 5000000,
    "totalInvoicesOutAmount": 7500000,
    "totalEmployees": 25,
    "totalInventoryItems": 500,
    "lowStockItems": 15,
    "pendingPayrolls": 3,
    "currencyBreakdown": [
      {
        "currency": "SYP",
        "amount": 10000000
      },
      {
        "currency": "TRY",
        "amount": 500000
      },
      {
        "currency": "USD",
        "amount": 25000
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "بيانات غير صحيحة",
  "errors": {
    "username": "اسم المستخدم مطلوب",
    "email": "البريد الإلكتروني غير صحيح"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "رمز الوصول مطلوب"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "ليس لديك صلاحية للوصول إلى هذا المورد"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "المستخدم غير موجود"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "اسم المستخدم أو البريد الإلكتروني موجود مسبقاً"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "حدث خطأ في الخادم"
}
```

## Rate Limiting

- **Authentication endpoints**: 5 محاولات كل 15 دقيقة
- **API endpoints**: 100 طلب كل 15 دقيقة
- **File upload**: 10 رفع كل دقيقة

## Trial System

### Trial Expired Response
```json
{
  "success": false,
  "message": "انتهت فترة التجربة",
  "code": "TRIAL_EXPIRED"
}
```

### Trial Required Response
```json
{
  "success": false,
  "message": "هذه الميزة متاحة فقط في النسخة التجريبية",
  "code": "TRIAL_REQUIRED"
}
```

## User Roles and Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| SUPER_ADMIN | مدير النظام | جميع الصلاحيات |
| ADMIN | مدير | إدارة المستخدمين والعمليات |
| ACCOUNTANT | محاسب | الواردات والصادرات والتقارير |
| WAREHOUSE_MANAGER | مدير مستودع | إدارة المخزون |
| USER | مستخدم | عرض محدود |

## Data Models

### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  locale: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  trialStartDate?: Date;
  trialEndDate?: Date;
  isTrialActive: boolean;
}
```

### UserRole
```typescript
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'WAREHOUSE_MANAGER' | 'USER';
```

---

**نظام إبراهيم للمحاسبة** - وثائق API 📚
