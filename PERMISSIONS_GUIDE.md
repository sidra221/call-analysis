# دليل نظام الصلاحيات - Permissions System Guide

## 📋 نظرة عامة

تم إنشاء نظام صلاحيات مخصص يعتمد على دور المستخدم (Role-based permissions) باستخدام JWT Authentication.

---

## 🔐 Permissions المخصصة

### 1. `IsQA`
- **الوصف:** يسمح فقط للمستخدمين بدور **QA (Quality Assurance)**
- **الاستخدام:** `permission_classes = [IsAuthenticated, IsQA]`

### 2. `IsManager`
- **الوصف:** يسمح فقط للمستخدمين بدور **Manager**
- **الاستخدام:** `permission_classes = [IsAuthenticated, IsManager]`

### 3. `IsManagerOrQA`
- **الوصف:** يسمح للمستخدمين بدور **Manager** أو **QA**
- **الاستخدام:** `permission_classes = [IsAuthenticated, IsManagerOrQA]`

---

## 🌐 API Endpoints

### Public Endpoints (لا تحتاج Authentication)

#### 1. POST `/api/auth/register/`
- **Permission:** `AllowAny`
- **الوصف:** تسجيل مستخدم جديد
- **Request:**
```json
{
  "username": "user1",
  "email": "user1@test.com",
  "password": "password123",
  "role": "manager" // أو "qa"
}
```

#### 2. POST `/api/auth/login/`
- **Permission:** `AllowAny`
- **الوصف:** تسجيل الدخول والحصول على JWT tokens
- **Request:**
```json
{
  "username": "user1",
  "password": "password123"
}
```
- **Response:**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. POST `/api/auth/token/refresh/`
- **Permission:** `AllowAny`
- **الوصف:** تحديث access token باستخدام refresh token
- **Request:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Protected Endpoints (تحتاج Authentication)

**ملاحظة:** جميع الـ endpoints التالية تحتاج **JWT Token** في الـ header:
```
Authorization: Bearer <access_token>
```

#### 4. GET `/api/auth/me/`
- **Permission:** `IsAuthenticated`
- **الوصف:** معلومات المستخدم الحالي
- **Response:**
```json
{
  "message": "This endpoint requires authentication",
  "user": "user1",
  "email": "user1@test.com",
  "role": "manager"
}
```

#### 5. GET `/api/auth/manager-only/`
- **Permission:** `IsAuthenticated, IsManager`
- **الوصف:** فقط Managers يمكنهم الوصول
- **Response (Manager):**
```json
{
  "message": "This is a Manager-only endpoint",
  "user": "manager1",
  "role": "manager"
}
```
- **Response (QA أو غير Manager):**
```json
{
  "detail": "You must be a Manager to perform this action."
}
```
- **Status Code:** `403 Forbidden`

#### 6. GET `/api/auth/qa-only/`
- **Permission:** `IsAuthenticated, IsQA`
- **الوصف:** فقط QAs يمكنهم الوصول
- **Response (QA):**
```json
{
  "message": "This is a QA-only endpoint",
  "user": "qa1",
  "role": "qa"
}
```
- **Response (Manager أو غير QA):**
```json
{
  "detail": "You must be a QA to perform this action."
}
```
- **Status Code:** `403 Forbidden`

#### 7. GET `/api/auth/manager-or-qa/`
- **Permission:** `IsAuthenticated, IsManagerOrQA`
- **الوصف:** Managers و QAs يمكنهم الوصول
- **Response:**
```json
{
  "message": "This endpoint is accessible to Managers and QAs",
  "user": "user1",
  "role": "manager" // أو "qa"
}
```

---

## 🔒 Default Permissions

**الإعدادات الافتراضية:**
- `DEFAULT_AUTHENTICATION_CLASSES`: `JWTAuthentication`
- `DEFAULT_PERMISSION_CLASSES`: `IsAuthenticated`

**هذا يعني:**
- ✅ جميع الـ endpoints محمية افتراضياً
- ✅ تحتاج JWT token للوصول
- ✅ الـ endpoints التي تريد أن تكون public يجب أن تضيف `AllowAny` صراحة

---

## 📝 كيفية استخدام Permissions في Views جديدة

### مثال 1: Manager Only View
```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .permissions import IsManager

class MyManagerView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    
    def get(self, request):
        return Response({"message": "Manager access granted"})
```

### مثال 2: QA Only View
```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .permissions import IsQA

class MyQAView(APIView):
    permission_classes = [IsAuthenticated, IsQA]
    
    def get(self, request):
        return Response({"message": "QA access granted"})
```

### مثال 3: Public View (لا يحتاج authentication)
```python
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class MyPublicView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"message": "Public endpoint"})
```

### مثال 4: Authenticated View (أي مستخدم مصادق عليه)
```python
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class MyAuthenticatedView(APIView):
    permission_classes = [IsAuthenticated]  # Default, يمكن حذفها
    
    def get(self, request):
        return Response({"message": "Authenticated endpoint"})
```

---

## 🧪 اختبار الصلاحيات

### 1. اختبار بدون Token
```bash
GET http://localhost:8000/api/auth/me/
# Response: 401 Unauthorized
# {
#   "detail": "Authentication credentials were not provided."
# }
```

### 2. اختبار Manager-only endpoint (كمستخدم QA)
```bash
GET http://localhost:8000/api/auth/manager-only/
Authorization: Bearer <qa_access_token>
# Response: 403 Forbidden
# {
#   "detail": "You must be a Manager to perform this action."
# }
```

### 3. اختبار Manager-only endpoint (كمستخدم Manager)
```bash
GET http://localhost:8000/api/auth/manager-only/
Authorization: Bearer <manager_access_token>
# Response: 200 OK
# {
#   "message": "This is a Manager-only endpoint",
#   "user": "manager1",
#   "role": "manager"
# }
```

---

## 📌 ملاحظات مهمة

1. **JWT Token مطلوب:** جميع الـ endpoints (عدا register/login/refresh) تحتاج JWT token
2. **Role-based Access:** الصلاحيات تعتمد على `UserProfile.role`
3. **Default Protection:** الـ default هو `IsAuthenticated` - أي endpoint جديد محمي تلقائياً
4. **Public Endpoints:** يجب إضافة `AllowAny` صراحة للـ endpoints العامة

---

## 🎯 ملخص

| Endpoint | Permission | الوصول |
|----------|-----------|--------|
| `/register/` | `AllowAny` | Public |
| `/login/` | `AllowAny` | Public |
| `/token/refresh/` | `AllowAny` | Public |
| `/me/` | `IsAuthenticated` | أي مستخدم مصادق عليه |
| `/manager-only/` | `IsManager` | فقط Managers |
| `/qa-only/` | `IsQA` | فقط QAs |
| `/manager-or-qa/` | `IsManagerOrQA` | Managers و QAs |

---

**تم إنشاء نظام صلاحيات كامل ومحمي! 🔒**

