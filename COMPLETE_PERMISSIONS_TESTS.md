# دليل اختبار شامل - نظام الصلاحيات
## Complete Permissions System Testing Guide

---

## 📋 جدول المحتويات
1. [Public Endpoints](#1-public-endpoints)
2. [Protected Endpoints - بدون Token](#2-protected-endpoints---بدون-token)
3. [Protected Endpoints - مع Manager Token](#3-protected-endpoints---مع-manager-token)
4. [Protected Endpoints - مع QA Token](#4-protected-endpoints---مع-qa-token)
5. [حالات Token غير صحيح](#5-حالات-token-غير-صحيح)

---

## 1. Public Endpoints

### ✅ **الحالة 1: تسجيل مستخدم Manager - نجاح**

**Request:**
```http
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "manager_test",
  "email": "manager_test@test.com",
  "password": "password123",
  "role": "manager"
}
```

**Response المتوقع:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "message": "User registered successfully"
}
```

---

### ✅ **الحالة 2: تسجيل مستخدم QA - نجاح**

**Request:**
```http
POST http://localhost:8000/api/auth/register/
Content-Type: application/json

{
  "username": "qa_test",
  "email": "qa_test@test.com",
  "password": "password123",
  "role": "qa"
}
```

**Response المتوقع:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "message": "User registered successfully"
}
```

---

### ✅ **الحالة 3: تسجيل دخول Manager - نجاح**

**Request:**
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "manager_test",
  "password": "password123"
}
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NzYyMDY1MCwiaWF0IjoxNzY3NTM0MjUwLCJqdGkiOiJlMDQzZWI3Y2FlMjM0ZjdjYmUxOGE3MTUyMWVlZjdlMyIsInVzZXJfaWQiOiIxIn0.fx07luUIEftxOTCdppHhMj6ffaG8IrIp6v8aBGw93vU"
}
```
> **⚠️ مهم:** انسخ الـ `access` token وضعه في المتغير `@managerToken` للاختبارات التالية

---

### ✅ **الحالة 4: تسجيل دخول QA - نجاح**

**Request:**
```http
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "qa_test",
  "password": "password123"
}
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjIifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NzYyMDY1MCwiaWF0IjoxNzY3NTM0MjUwLCJqdGkiOiJlMDQzZWI3Y2FlMjM0ZjdjYmUxOGE3MTUyMWVlZjdlMyIsInVzZXJfaWQiOiIyIn0.fx07luUIEftxOTCdppHhMj6ffaG8IrIp6v8aBGw93vU"
}
```
> **⚠️ مهم:** انسخ الـ `access` token وضعه في المتغير `@qaToken` للاختبارات التالية

---

### ✅ **الحالة 5: تحديث Token - نجاح**

**Request:**
```http
POST http://localhost:8000/api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NzYyMDY1MCwiaWF0IjoxNzY3NTM0MjUwLCJqdGkiOiJlMDQzZWI3Y2FlMjM0ZjdjYmUxOGE3MTUyMWVlZjdlMyIsInVzZXJfaWQiOiIxIn0.fx07luUIEftxOTCdppHhMj6ffaG8IrIp6v8aBGw93vU"
}
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.NEW_ACCESS_TOKEN_HERE",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NzYyMDY1MCwiaWF0IjoxNzY3NTM0MjUwLCJqdGkiOiJlMDQzZWI3Y2FlMjM0ZjdjYmUxOGE3MTUyMWVlZjdlMyIsInVzZXJfaWQiOiIxIn0.NEW_REFRESH_TOKEN_HERE"
}
```

---

## 2. Protected Endpoints - بدون Token

### ❌ **الحالة 1: GET /api/auth/me/ - بدون Token**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### ❌ **الحالة 2: GET /api/auth/manager-only/ - بدون Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-only/
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### ❌ **الحالة 3: GET /api/auth/qa-only/ - بدون Token**

**Request:**
```http
GET http://localhost:8000/api/auth/qa-only/
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### ❌ **الحالة 4: GET /api/auth/manager-or-qa/ - بدون Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-or-qa/
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 3. Protected Endpoints - مع Manager Token

> **ملاحظة:** استخدم الـ `access` token من تسجيل دخول Manager في الـ header:
> ```
> Authorization: Bearer <manager_access_token>
> ```

### ✅ **الحالة 1: GET /api/auth/me/ - مع Manager Token**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This endpoint requires authentication",
  "user": "manager_test",
  "email": "manager_test@test.com",
  "role": "manager"
}
```

---

### ✅ **الحالة 2: GET /api/auth/manager-only/ - مع Manager Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-only/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This is a Manager-only endpoint",
  "user": "manager_test",
  "role": "manager"
}
```

---

### ❌ **الحالة 3: GET /api/auth/qa-only/ - مع Manager Token**

**Request:**
```http
GET http://localhost:8000/api/auth/qa-only/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `403 Forbidden`
- **Response Body:**
```json
{
  "detail": "You must be a QA to perform this action."
}
```

---

### ✅ **الحالة 4: GET /api/auth/manager-or-qa/ - مع Manager Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-or-qa/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This endpoint is accessible to Managers and QAs",
  "user": "manager_test",
  "role": "manager"
}
```

---

## 4. Protected Endpoints - مع QA Token

> **ملاحظة:** استخدم الـ `access` token من تسجيل دخول QA في الـ header:
> ```
> Authorization: Bearer <qa_access_token>
> ```

### ✅ **الحالة 1: GET /api/auth/me/ - مع QA Token**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjIifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This endpoint requires authentication",
  "user": "qa_test",
  "email": "qa_test@test.com",
  "role": "qa"
}
```

---

### ❌ **الحالة 2: GET /api/auth/manager-only/ - مع QA Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-only/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjIifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `403 Forbidden`
- **Response Body:**
```json
{
  "detail": "You must be a Manager to perform this action."
}
```

---

### ✅ **الحالة 3: GET /api/auth/qa-only/ - مع QA Token**

**Request:**
```http
GET http://localhost:8000/api/auth/qa-only/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjIifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This is a QA-only endpoint",
  "user": "qa_test",
  "role": "qa"
}
```

---

### ✅ **الحالة 4: GET /api/auth/manager-or-qa/ - مع QA Token**

**Request:**
```http
GET http://localhost:8000/api/auth/manager-or-qa/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM3ODUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjIifQ.ODRXO-W7sMjEOAM_QAbDHylv2w9HdnwEvUPiSE7NgDU
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "message": "This endpoint is accessible to Managers and QAs",
  "user": "qa_test",
  "role": "qa"
}
```

---

## 5. حالات Token غير صحيح

### ❌ **الحالة 1: Token غير موجود في Header**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer 
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### ❌ **الحالة 2: Token غير صحيح (Invalid Token)**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer invalid_token_here_12345
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

---

### ❌ **الحالة 3: استخدام Refresh Token بدل Access Token**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NzYyMDY1MCwiaWF0IjoxNzY3NTM0MjUwLCJqdGkiOiJlMDQzZWI3Y2FlMjM0ZjdjYmUxOGE3MTUyMWVlZjdlMyIsInVzZXJfaWQiOiIxIn0.fx07luUIEftxOTCdppHhMj6ffaG8IrIp6v8aBGw93vU
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Token has wrong type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token has wrong type"
    }
  ]
}
```

---

### ❌ **الحالة 4: Token منتهي الصلاحية (Expired Token)**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY3NTM0MjUwLCJpYXQiOjE3Njc1MzQyNTAsImp0aSI6IjQ3YjRlYTUyZGExMTQzNzk4NTM5MWNkNmYwZjgwZTQxIiwidXNlcl9pZCI6IjEifQ.EXPIRED_TOKEN_SIGNATURE
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```

---

### ❌ **الحالة 5: Header غير موجود**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### ❌ **الحالة 6: Bearer غير موجود في Header**

**Request:**
```http
GET http://localhost:8000/api/auth/me/
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response المتوقع:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 📊 ملخص جميع الحالات

| # | Endpoint | Token | Role | Status | Response |
|---|----------|-------|------|--------|----------|
| 1 | `/register/` | - | - | 201 | Success |
| 2 | `/login/` | - | - | 200 | Tokens |
| 3 | `/token/refresh/` | - | - | 200 | New Tokens |
| 4 | `/me/` | ❌ | - | 401 | No credentials |
| 5 | `/me/` | ✅ | Manager | 200 | User info |
| 6 | `/me/` | ✅ | QA | 200 | User info |
| 7 | `/manager-only/` | ❌ | - | 401 | No credentials |
| 8 | `/manager-only/` | ✅ | Manager | 200 | Success |
| 9 | `/manager-only/` | ✅ | QA | 403 | Forbidden |
| 10 | `/qa-only/` | ❌ | - | 401 | No credentials |
| 11 | `/qa-only/` | ✅ | Manager | 403 | Forbidden |
| 12 | `/qa-only/` | ✅ | QA | 200 | Success |
| 13 | `/manager-or-qa/` | ❌ | - | 401 | No credentials |
| 14 | `/manager-or-qa/` | ✅ | Manager | 200 | Success |
| 15 | `/manager-or-qa/` | ✅ | QA | 200 | Success |
| 16 | `/me/` | Invalid | - | 401 | Token invalid |
| 17 | `/me/` | Refresh | - | 401 | Wrong type |
| 18 | `/me/` | Expired | - | 401 | Expired |

---

## 🎯 خطوات الاختبار الموصى بها

1. **ابدأ بـ Public Endpoints:**
   - سجل Manager
   - سجل QA
   - سجل دخول Manager واحفظ token
   - سجل دخول QA واحفظ token

2. **اختبر بدون Token:**
   - جميع الـ protected endpoints يجب أن ترجع 401

3. **اختبر مع Manager Token:**
   - `/me/` → 200 ✅
   - `/manager-only/` → 200 ✅
   - `/qa-only/` → 403 ❌
   - `/manager-or-qa/` → 200 ✅

4. **اختبر مع QA Token:**
   - `/me/` → 200 ✅
   - `/manager-only/` → 403 ❌
   - `/qa-only/` → 200 ✅
   - `/manager-or-qa/` → 200 ✅

5. **اختبر Token غير صحيح:**
   - Invalid token → 401
   - Refresh token → 401
   - Expired token → 401

---

**تم! الآن لديك دليل اختبار شامل لكل الحالات! 🎉**

