# دليل اختبار API - Authentication Endpoints

## 📋 جدول المحتويات
1. [POST /api/auth/register/](#1-post-apiauthregister)
2. [POST /api/auth/login/](#2-post-apiauthlogin)
3. [POST /api/auth/token/refresh/](#3-post-apiauthtokenrefresh)

---

## 1. POST /api/auth/register/

### ✅ **الحالة 1: تسجيل مستخدم جديد (Manager) - نجاح**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "manager1",
  "email": "manager1@test.com",
  "password": "password123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "message": "User registered successfully"
}
```

---

### ✅ **الحالة 2: تسجيل مستخدم جديد (QA) - نجاح**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "qa1",
  "email": "qa1@test.com",
  "password": "password123",
  "role": "qa"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "message": "User registered successfully"
}
```

---

### ❌ **الحالة 3: بيانات ناقصة - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "user1",
  "email": "user1@test.com"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "password": ["This field is required."],
  "role": ["This field is required."]
}
```

---

### ❌ **الحالة 4: Username موجود مسبقاً - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "manager1",
  "email": "newemail@test.com",
  "password": "password123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "username": ["A user with that username already exists."]
}
```

---

### ❌ **الحالة 5: Email موجود مسبقاً - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "manager1@test.com",
  "password": "password123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "email": ["user with this email already exists."]
}
```

---

### ❌ **الحالة 6: Password أقل من 8 أحرف - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "user2",
  "email": "user2@test.com",
  "password": "pass123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "password": ["Ensure this field has at least 8 characters."]
}
```

---

### ❌ **الحالة 7: Role غير صحيح - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "user3",
  "email": "user3@test.com",
  "password": "password123",
  "role": "admin"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "role": ["Invalid choice. It is one of: manager, qa."]
}
```

---

### ❌ **الحالة 8: Email غير صحيح - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "user4",
  "email": "invalid-email",
  "password": "password123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "email": ["Enter a valid email address."]
}
```

---

### ❌ **الحالة 9: Username فارغ - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "",
  "email": "user5@test.com",
  "password": "password123",
  "role": "manager"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "username": ["This field may not be blank."]
}
```

---

## 2. POST /api/auth/login/

### ✅ **الحالة 1: تسجيل دخول بنجاح**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "manager1",
  "password": "password123"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```
> **ملاحظة:** الـ tokens ستكون مختلفة في كل مرة

---

### ❌ **الحالة 2: Username غير موجود - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "nonexistent",
  "password": "password123"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### ❌ **الحالة 3: Password خاطئ - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "manager1",
  "password": "wrongpassword"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "No active account found with the given credentials"
}
```

---

### ❌ **الحالة 4: بيانات ناقصة (بدون username) - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "password": "password123"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "username": ["This field is required."]
}
```

---

### ❌ **الحالة 5: بيانات ناقصة (بدون password) - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "manager1"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "password": ["This field is required."]
}
```

---

### ❌ **الحالة 6: Body فارغ - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "username": ["This field is required."],
  "password": ["This field is required."]
}
```

---

## 3. POST /api/auth/token/refresh/

### ✅ **الحالة 1: تحديث Token بنجاح**
**ملاحظة:** احصل على `refresh` token من `/api/auth/login/` أولاً

**Request:**
```json
POST http://localhost:8000/api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**النتيجة المتوقعة:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```
> **ملاحظة:** بسبب `ROTATE_REFRESH_TOKENS: True` في الإعدادات، الـ endpoint رح يرجع `access` token جديد و `refresh` token جديد. استخدم الـ `refresh` token الجديد في المرة القادمة.

---

### ❌ **الحالة 2: Refresh Token غير موجود - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/token/refresh/
Content-Type: application/json

{}
```

**النتيجة المتوقعة:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "refresh": ["This field is required."]
}
```

---

### ❌ **الحالة 3: Refresh Token غير صحيح - فشل**
**Request:**
```json
POST http://localhost:8000/api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "invalid_token_here"
}
```

**النتيجة المتوقعة:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

---

### ❌ **الحالة 4: استخدام Access Token بدل Refresh Token - فشل**
**ملاحظة:** استخدم `access` token بدل `refresh` token

**Request:**
```json
POST http://localhost:8000/api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..." // هذا access token
}
```

**النتيجة المتوقعة:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Token has wrong type",
  "code": "token_not_valid"
}
```

---

## 📝 ملاحظات مهمة للاختبار:

1. **ترتيب الاختبار:**
   - ابدأ بـ `/register/` لإنشاء مستخدمين
   - ثم اختبر `/login/` للحصول على tokens
   - أخيراً اختبر `/token/refresh/`

2. **حفظ Tokens:**
   - بعد `/login/` احفظ الـ `refresh` token للاختبار
   - الـ `access` token صالح لمدة 60 دقيقة (حسب الإعدادات)
   - الـ `refresh` token صالح لمدة 24 ساعة

3. **استخدام REST Client:**
   - استخدم VS Code extension مثل **REST Client** أو **Thunder Client**
   - أو استخدم **Postman** أو **Insomnia**

4. **Headers مهمة:**
   - تأكد من إضافة `Content-Type: application/json`
   - للـ protected endpoints، أضف: `Authorization: Bearer <access_token>`

---

## 🎯 ملخص الحالات:

| Endpoint | الحالات | النجاح | الفشل |
|----------|---------|--------|-------|
| `/register/` | 9 حالات | 2 | 7 |
| `/login/` | 6 حالات | 1 | 5 |
| `/token/refresh/` | 4 حالات | 1 | 3 |
| **المجموع** | **19 حالة** | **4** | **15** |

---

**بالتوفيق في الاختبار! 🚀**

