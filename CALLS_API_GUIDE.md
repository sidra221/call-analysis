# دليل API - إدارة الملفات الصوتية
## Calls API Documentation

---

## 📋 نظرة عامة

API لإدارة الملفات الصوتية (Calls) يتضمن:
- ✅ رفع ملف صوتي
- ✅ عرض ملف صوتي
- ✅ تحميل ملف صوتي
- ✅ عرض قائمة الملفات الصوتية
- ✅ فلترة حسب sentiment (إيجابي/سلبي/محايد)

**جميع الـ endpoints محمية وتحتاج JWT Authentication**

---

## 🔐 Authentication

جميع الـ endpoints تحتاج **JWT Token** في الـ header:
```
Authorization: Bearer <access_token>
```

**Permissions:** `IsAuthenticated, IsManagerOrQA`
- فقط المستخدمين المصادق عليهم (Manager أو QA) يمكنهم الوصول

---

## 🌐 API Endpoints

### 1. رفع ملف صوتي

**POST** `/api/calls/`

**Request:**
```http
POST http://localhost:8000/api/calls/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

audio_file: <file>
```

**أو باستخدام JSON (base64):**
```json
{
  "audio_file": "data:audio/mpeg;base64,..."
}
```

**Response المتوقع:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "id": 1,
  "uploaded_by": 1,
  "uploaded_by_username": "manager_test",
  "audio_file": "/media/calls/audio_file.mp3",
  "status": "pending",
  "created_at": "2026-01-04T16:00:00Z",
  "analysis": null
}
```

---

### 2. عرض ملف صوتي (تفاصيل)

**GET** `/api/calls/{id}/`

**Request:**
```http
GET http://localhost:8000/api/calls/1/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "id": 1,
  "uploaded_by": 1,
  "uploaded_by_username": "manager_test",
  "audio_file": "/media/calls/audio_file.mp3",
  "status": "completed",
  "created_at": "2026-01-04T16:00:00Z",
  "analysis": {
    "id": 1,
    "call_id": 1,
    "transcript": "نص المكالمة...",
    "sentiment": "positive",
    "sentiment_score": 0.85,
    "main_issue": "استفسار عن المنتج",
    "keywords": ["منتج", "سعر", "جودة"],
    "needs_follow_up": false,
    "priority": "low",
    "analyzed_at": "2026-01-04T16:05:00Z"
  }
}
```

---

### 3. تحميل ملف صوتي

**GET** `/api/calls/{id}/download/`

**Request:**
```http
GET http://localhost:8000/api/calls/1/download/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Content-Type:** `audio/mpeg`
- **Content-Disposition:** `attachment; filename="audio_file.mp3"`
- **Response:** ملف صوتي للتحميل

**في حالة عدم وجود ملف:**
- **Status Code:** `404 Not Found`
- **Response Body:**
```json
{
  "error": "Audio file not found"
}
```

---

### 4. عرض قائمة الملفات الصوتية

**GET** `/api/calls/`

**Request:**
```http
GET http://localhost:8000/api/calls/
Authorization: Bearer <access_token>
```

**Query Parameters (اختياري):**
- `sentiment`: فلترة حسب sentiment (`positive`, `negative`, `neutral`)
- `status`: فلترة حسب status (`pending`, `processing`, `completed`, `failed`)
- `user`: فلترة حسب username

**مثال:**
```http
GET http://localhost:8000/api/calls/?sentiment=positive&status=completed
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
[
  {
    "id": 1,
    "uploaded_by_username": "manager_test",
    "audio_file": "/media/calls/audio_file.mp3",
    "status": "completed",
    "sentiment": "positive",
    "created_at": "2026-01-04T16:00:00Z"
  },
  {
    "id": 2,
    "uploaded_by_username": "qa_test",
    "audio_file": "/media/calls/audio_file2.mp3",
    "status": "completed",
    "sentiment": "negative",
    "created_at": "2026-01-04T15:00:00Z"
  }
]
```

---

### 5. عرض الملفات الصوتية الإيجابية

**GET** `/api/calls/positive/`

**Request:**
```http
GET http://localhost:8000/api/calls/positive/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
[
  {
    "id": 1,
    "uploaded_by_username": "manager_test",
    "audio_file": "/media/calls/audio_file.mp3",
    "status": "completed",
    "sentiment": "positive",
    "created_at": "2026-01-04T16:00:00Z"
  }
]
```

---

### 6. عرض الملفات الصوتية السلبية

**GET** `/api/calls/negative/`

**Request:**
```http
GET http://localhost:8000/api/calls/negative/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
[
  {
    "id": 2,
    "uploaded_by_username": "qa_test",
    "audio_file": "/media/calls/audio_file2.mp3",
    "status": "completed",
    "sentiment": "negative",
    "created_at": "2026-01-04T15:00:00Z"
  }
]
```

---

### 7. عرض الملفات الصوتية المحايدة

**GET** `/api/calls/neutral/`

**Request:**
```http
GET http://localhost:8000/api/calls/neutral/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
[
  {
    "id": 3,
    "uploaded_by_username": "manager_test",
    "audio_file": "/media/calls/audio_file3.mp3",
    "status": "completed",
    "sentiment": "neutral",
    "created_at": "2026-01-04T14:00:00Z"
  }
]
```

---

### 8. تحديث ملف صوتي

**PUT/PATCH** `/api/calls/{id}/`

**Request:**
```http
PATCH http://localhost:8000/api/calls/1/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "completed"
}
```

**Response المتوقع:**
- **Status Code:** `200 OK`
- **Response Body:** Call object محدث

---

### 9. حذف ملف صوتي

**DELETE** `/api/calls/{id}/`

**Request:**
```http
DELETE http://localhost:8000/api/calls/1/
Authorization: Bearer <access_token>
```

**Response المتوقع:**
- **Status Code:** `204 No Content`

---

## ❌ حالات الخطأ

### 1. بدون Token

**Request:**
```http
GET http://localhost:8000/api/calls/
```

**Response:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 2. Token غير صحيح

**Request:**
```http
GET http://localhost:8000/api/calls/
Authorization: Bearer invalid_token
```

**Response:**
- **Status Code:** `401 Unauthorized`
- **Response Body:**
```json
{
  "detail": "Given token not valid for any token type"
}
```

---

### 3. ملف غير موجود

**Request:**
```http
GET http://localhost:8000/api/calls/999/
Authorization: Bearer <access_token>
```

**Response:**
- **Status Code:** `404 Not Found`
- **Response Body:**
```json
{
  "detail": "Not found."
}
```

---

### 4. رفع ملف بدون audio_file

**Request:**
```http
POST http://localhost:8000/api/calls/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{}
```

**Response:**
- **Status Code:** `400 Bad Request`
- **Response Body:**
```json
{
  "audio_file": ["This field is required."]
}
```

---

## 📊 ملخص الـ Endpoints

| Method | Endpoint | الوصف | Query Params |
|--------|----------|-------|--------------|
| POST | `/api/calls/` | رفع ملف صوتي | - |
| GET | `/api/calls/` | قائمة الملفات | `sentiment`, `status`, `user` |
| GET | `/api/calls/{id}/` | تفاصيل ملف | - |
| GET | `/api/calls/{id}/download/` | تحميل ملف | - |
| GET | `/api/calls/positive/` | ملفات إيجابية | - |
| GET | `/api/calls/negative/` | ملفات سلبية | - |
| GET | `/api/calls/neutral/` | ملفات محايدة | - |
| PUT/PATCH | `/api/calls/{id}/` | تحديث ملف | - |
| DELETE | `/api/calls/{id}/` | حذف ملف | - |

---

## 🎯 أمثلة استخدام

### مثال 1: رفع ملف صوتي
```bash
curl -X POST http://localhost:8000/api/calls/ \
  -H "Authorization: Bearer <token>" \
  -F "audio_file=@/path/to/audio.mp3"
```

### مثال 2: عرض ملفات إيجابية
```bash
curl -X GET http://localhost:8000/api/calls/positive/ \
  -H "Authorization: Bearer <token>"
```

### مثال 3: تحميل ملف
```bash
curl -X GET http://localhost:8000/api/calls/1/download/ \
  -H "Authorization: Bearer <token>" \
  -o audio_file.mp3
```

### مثال 4: فلترة حسب sentiment و status
```bash
curl -X GET "http://localhost:8000/api/calls/?sentiment=positive&status=completed" \
  -H "Authorization: Bearer <token>"
```

---

## 📝 ملاحظات مهمة

1. **نوع الملف:** يدعم جميع أنواع الملفات الصوتية (mp3, wav, m4a, etc.)
2. **حجم الملف:** تأكد من إعدادات Django للحد الأقصى لحجم الملف
3. **الصلاحيات:** فقط Manager و QA يمكنهم الوصول
4. **الفلترة:** يمكن دمج عدة filters في نفس الوقت
5. **التحميل:** الملفات يتم تحميلها كـ attachment

---

**تم إنشاء API كامل لإدارة الملفات الصوتية! 🎵**

