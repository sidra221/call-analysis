# Call Analysis System — دليل المشروع

وثيقة مرجعية شاملة لوصف نظام تحليل المكالمات: الغرض منه، البنية التقنية، نماذج البيانات، واجهات البرمجة، الواجهات الأمامية، وسير العمل. يُفترض أن تكون هذه الوثيقة كافية بمفردها لفهم المشروع دون الحاجة إلى استكشاف الكود مباشرة.

---

## 1. نظرة عامة

**Call Analysis System** مشروع تخرج لإدارة وتحليل المكالمات الصوتية. يوفّر النظام بيئة عمل متكاملة بين فريق ضمان الجودة (QA) والمدير (Manager)، مع دعم تحليل آلي عبر خدمة ذكاء اصطناعي منفصلة.

### الوظائف الرئيسية

- رفع تسجيلات المكالمات وتحليلها آلياً (نسخ نصي، تحليل مشاعر، تحديد أولوية، استخراج المشاكل الرئيسية)
- مراجعة نتائج التحليل واعتماد المكالمات
- إنشاء مهام متابعة (Follow-ups) وتعيينها للمستخدمين
- إنشاء تقارير دورية (يومية / أسبوعية) ونشرها للمدير
- مراجعة المدير للتقارير، إضافة ملاحظات، وتحميل ملف PDF
- لوحة تحكم إحصائية مع تحديثات حية عبر WebSockets
- إشعارات في شريط التطبيق العلوي (مكالمات، متابعات، تقارير، ملاحظات المدير)

---

## 2. التقنيات المستخدمة

| الطبقة | التقنيات |
|--------|----------|
| **Backend** | Django 5، Django REST Framework، SimpleJWT، PostgreSQL، Celery، Redis، Django Channels، Daphne |
| **Frontend** | React 19، Vite 7، Material UI 7، React Router 7، Tabler Icons، Zustand (قالب Berry) |
| **AI Service** | FastAPI (`ai_service/`) — Whisper للنسخ ومعالجة لغوية للتحليل |
| **تقارير PDF** | `reportlab` (من `requirements.txt`) مع بديل احتياطي بمكتبة Python القياسية في `backend/reports/pdf_utils.py` |
| **البنية التحتية** | Docker Compose |

### خدمات Docker Compose

| الخدمة | اسم الحاوية | المنفذ |
|--------|-------------|--------|
| `web` | `call_analysis_backend` | 8000 |
| `frontend` | `call_analysis_frontend` | 3000 |
| `db` | `call_analysis_db` | 5433 |
| `redis` | `call_analysis_redis` | 6379 |
| `celery_worker` | `call_analysis_celery_worker` | — |
| `celery_beat` | `call_analysis_celery_beat` | — |
| `pgadmin` | `call_analysis_pgadmin` | 5050 |

> **تنبيه:** اسم خدمة الـ Backend في ملف `docker-compose.yml` هو `web` وليس `backend`.

---

## 3. هيكل المشروع

```
call_analysis/
├── backend/                      # تطبيق Django
│   ├── config/                   # الإعدادات، المسارات، ASGI
│   ├── accounts/                 # المصادقة، UserProfile، إدارة المستخدمين
│   ├── calls/                    # Call، CallAnalysis، FollowUp، مهام Celery
│   ├── dashboard/                # إحصائيات لوحة التحكم
│   ├── reports/                  # نموذج Report، ViewSet، pdf_utils.py
│   └── logs/                     # سجل النشاط ActivityLog
├── frontend/                     # تطبيق React (SPA)
│   └── src/
│       ├── pages/                # Dashboard، Calls، Followups، Reports، Users، Logs
│       ├── api/api.js            # عميل HTTP مع تجديد JWT تلقائياً
│       ├── contexts/             # AuthContext
│       ├── ui-component/         # مكوّنات مشتركة (مثل UserAvatarWithName)
│       ├── layout/.../NotificationSection/  # الإشعارات
│       └── routes/               # MainRoutes، ProtectedRoute
├── ai_service/                   # خدمة FastAPI المنفصلة
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

---

## 4. الأدوار والصلاحيات

| الدور | المسؤوليات | الصفحات المتاحة |
|-------|------------|-----------------|
| **manager** | مراجعة التقارير المنشورة، إدارة المستخدمين، تحميل PDF، مراجعة المكالمات | Dashboard، Calls، Reports، Users، Logs |
| **qa** | رفع المكالمات، إدارة المتابعات، إنشاء التقارير ونشرها | Dashboard، Calls، Followups، Reports |
| **agent** | دور معرّف في النموذج؛ معظم واجهات البرمجة تتطلب manager أو qa | Dashboard، Profile |

### تخزين الدور

يُخزَّن الدور في نموذج `UserProfile` المرتبط بـ `User` عبر `related_name='profile'`. الوصول إلى الدور: `user.profile.role`.

### طبقات الحماية

1. **Backend:** صلاحيات DRF (`IsManager`، `IsQA`، `IsManagerOrQA`)
2. **Frontend:** مكوّن `ProtectedRoute` مع خاصية `allowedRoles`
3. **القائمة الجانبية:** تعريف العناصر حسب الدور في `menu-items/dashboard.js`

---

## 5. نماذج البيانات

### Call

| الحقل | الوصف |
|-------|-------|
| `uploaded_by` | المستخدم الذي رفع المكالمة |
| `audio_file` | ملف الصوت |
| `status` | `pending` → `processing` → `completed` / `failed` |
| `duration` | مدة المكالمة |

### CallAnalysis (علاقة 1:1 مع Call)

`main_issue`، `sentiment`، `sentiment_score`، `keywords`، `priority`، `needs_followup`، `transcript`، `is_reviewed`، `top_issues`، `confidence_score`، `detected_language`

### FollowUp

مرتبط بـ `Call`، مع حقول `assigned_to`، `notes`، `status` (`pending` | `in_progress` | `done`).

### Report

**دورة الحياة:** `draft` → `published` → `reviewed`

| الفئة | الحقول |
|-------|--------|
| التعريف | `created_by` (QA)، `period` (`daily` / `weekly`)، `date_from`، `date_to` |
| المحتوى | `summary`، `positives`، `recommendations`، `top_issues`، `sentiment_stats` |
| مراجعة المدير | `manager_notes`، `reviewed_by`، `reviewed_at` |

**الحقول الإضافية في Serializer:** `created_by_username`، `created_by_role`، `reviewed_by_username`

**الترحيلات:** `0001_initial` → `0002` (إضافة manager_notes وحقول المراجعة) → `0003` (إعادة تسمية approved إلى reviewed)

### ActivityLog

`user`، `action`، `description`، `created_at`

---

## 6. واجهات البرمجة (API)

### تنسيق الاستجابة

```json
{ "success": true, "data": ..., "error": null }
```

**استثناء:** نقطة النهاية `GET .../download/` تُرجع ملف PDF مباشرة دون غلاف JSON.

### Accounts — `/api/accounts/`

| Method | Path | الصلاحية |
|--------|------|----------|
| POST | `/register/` | عام |
| POST | `/login/` | عام — يُرجع JWT |
| POST | `/token/refresh/` | عام |
| GET | `/me/` | مستخدم مسجّل — `{ id, user, email, role }` |
| GET | `/users/` | Manager |
| DELETE | `/users/<id>/` | Manager |
| GET | `/users-for-followups/` | Manager أو QA |

### Calls — `/api/calls/`

| المورد | المسار | الوظائف |
|--------|--------|---------|
| المكالمات | `/calls/calls/` | CRUD، `process`، `mark-reviewed`، تحميل الصوت |
| المتابعات | `/calls/followups/` | CRUD (Manager + QA) |

يُرجع `CallListSerializer` الحقول: `uploaded_by_username`، `uploaded_by_role` (من `uploaded_by.profile.role`).

### Dashboard — `/api/dashboard/`

| المسار | الوظيفة |
|--------|---------|
| `/` | نظرة عامة |
| `/summary/` | إحصائيات تفصيلية |
| `/topics/` | المواضيع المتكررة |
| `/live/` | أحدث المكالمات |

### Reports — `/api/reports/reports/`

| الإجراء | Method | المسار | الدور | ملاحظات |
|---------|--------|--------|-------|---------|
| القائمة | GET | `/` | Manager / QA | بدون pagination من DRF |
| التفاصيل | GET | `/<id>/` | Manager / QA | |
| التوليد | POST | `/generate/` | QA | يستدعي AI ويُنشئ draft |
| التعديل | PATCH | `/<id>/` | QA | مسموح في حالة draft فقط |
| النشر | POST | `/<id>/publish/` | QA | `draft` → `published` |
| المراجعة | POST | `/<id>/approve/` | Manager | `published` → `reviewed` |
| إضافة ملاحظات | POST | `/<id>/add-notes/` | Manager | `{ "notes": "..." }` — لا يغيّر الحالة |
| التحميل | GET | `/<id>/download/` | Manager | ملف PDF |
| الحذف | DELETE | `/<id>/` | QA | مسموح لـ draft فقط ولصاحب التقرير |

**فلترة القائمة (`get_queryset`):**

- **Manager:** `status in (published, reviewed)` و `created_by.profile.role = qa` — لا يرى التقارير المسودة
- **QA:** `created_by = request.user` — يرى تقاريره فقط

### Logs — `/api/logs/`

`GET /` — Manager فقط

---

## 7. سير العمل

### تحليل المكالمة

```
رفع الملف → status=pending
→ POST /process/ → مهمة Celery
→ استدعاء AI /analyze-call
→ إنشاء CallAnalysis
→ تحديث WebSocket
→ مراجعة QA / اعتماد Manager (mark-reviewed)
```

### المتابعات (Follow-up)

```
إنشاء متابعة من صفحة Calls أو Follow-ups
→ تعيين assigned_to + notes + status
→ تحديث الحالة من صفحة Follow-ups (QA)
```

### التقارير

```
[QA] POST /generate/ (period + date_from + date_to)
→ توليد المحتوى عبر AI → status=draft
→ تعديل summary / positives / recommendations (PATCH)
→ POST /publish/ → status=published

[Manager] عرض التقارير المنشورة والمُراجَعة فقط
→ View → Review (→ reviewed) | Add Notes | Download PDF

[QA] عرض تقاريره فقط
→ قراءة manager_notes في نافذة العرض
→ إشعار عند مراجعة المدير أو إضافة ملاحظات
→ حذف التقرير مسموح في حالة draft فقط
```

### الإشعارات (`NotificationSection`)

| الدور | نوع الإشعار |
|-------|-------------|
| Manager | تقارير جديدة بحالة published من فريق QA |
| QA | «تمت مراجعة تقريرك» أو «أضاف المدير ملاحظات على تقريرك» |

تعتمد المطابقة على `authUser.id` مع صاحب التقرير. يُنصح بإعادة تسجيل الدخول بعد أي تعديل على استجابة `/me/`.

---

## 8. الواجهة الأمامية

### المسارات والصلاحيات

| المسار | الصفحة | الأدوار |
|--------|--------|---------|
| `/dashboard` | لوحة التحكم | الكل |
| `/calls` | المكالمات | manager، qa |
| `/followups` | المتابعات | qa |
| `/reports` | التقارير | manager، qa |
| `/users` | المستخدمون | manager |
| `/logs` | السجلات | manager |
| `/profile` | الملف الشخصي | الكل |
| `/login`، `/register` | المصادقة | عام |

### صفحة Reports

**بطاقات الإحصائيات:** إجمالي التقارير | المنشورة | المسودات (QA) / المُراجَعة (Manager)

**البحث والتصفية:**
- البحث النصي: summary، التواريخ، الحالة، النوع، منشئ التقرير
- نافذة الفلاتر: الحالة (All / Draft* / Published / Reviewed) + النوع (Daily / Weekly)
- زر Reset All لإعادة التعيين

**الجدول:**
- الترتيب متاح على عمود **Period** فقط
- عمود **Created By** يظهر للمدير فقط
- عرض منشئ التقرير عبر المكوّن المشترك `UserAvatarWithName` (`frontend/src/ui-component/UserAvatarWithName.jsx`) — نفس العرض في صفحة Calls مع ألوان حسب الدور
- التصفح: `TablePagination`، 6 صفوف لكل صفحة (client-side)

**إجراءات الجدول:**

| الدور | الأيقونات |
|-------|-----------|
| QA | عرض + حذف (الحذف معطّل إذا لم تكن الحالة draft) |
| Manager | عرض + تحميل PDF |

**نوافذ الحوار:**
- **Manager:** Review، Add Notes، Download PDF
- **QA (draft):** Save Draft، Publish
- **QA (published / reviewed):** عرض Manager Notes عند توفرها

**نمط التصميم المشترك (Follow-ups و Reports):**
- بطاقة خارجية: `borderRadius: 3` مع حدود divider
- بطاقات الإحصائيات: `borderRadius: 2` مع أيقونات ملونة شفافة
- شرائح الحالة: Draft / Published / Reviewed بزوايا مستديرة

### المصادقة

1. `AuthContext` — تسجيل الدخول → JWT → `GET /me/`
2. تخزين `authUser` في localStorage: `{ id, user, email, role }`
3. `api.js` — تجديد الرمز تلقائياً عند استجابة 401

### عميل API للتقارير (`reportsApi`)

`list`، `get`، `generate`، `patch`، `publish`، `approve`، `addNotes`، `delete`، `downloadUrl`

---

## 9. خدمة الذكاء الاصطناعي

مسار الخدمة: `ai_service/` — تطبيق FastAPI منفصل.

| Endpoint | الوظيفة |
|----------|---------|
| `/analyze-call` | تحليل مكالمة واحدة |
| `/generate-report` | توليد محتوى تقرير من تحليلات الفترة |

**متغيرات البيئة في Backend:** `AI_SERVICE_URL`، `AI_SERVICE_API_KEY`، `AI_SERVICE_TIMEOUT`

> خدمة AI غير مضافة حالياً في `docker-compose.yml` — تُشغَّل يدوياً أو يُضاف لها تعريف في ملف Compose.

---

## 10. التشغيل عبر Docker

```bash
docker compose up --build
```

**أوامر شائعة:**

```bash
docker compose exec web python manage.py migrate
docker compose restart web
DOCKER_BUILDKIT=1 docker compose build web
```

**ملاحظات التشغيل:**

- الكود مربوط بـ volume (`.:/app`) — تعديلات الملفات تنعكس مباشرة دون إعادة بناء
- إعادة البناء ضرورية فقط عند إضافة حزم Python جديدة في `requirements.txt`
- في حال فشل البناء بسبب DNS أو الشبكة، يستخدم `Dockerfile` خيار `network: host` لمرحلتي apt و pip، كما يُفعَّل `network: host` في إعدادات البناء بملف Compose

**متغيرات Frontend:** `VITE_API_BASE_URL=http://localhost:8000`

**توثيق API:** `http://localhost:8000/docs/` (Swagger)

---

## 11. ملفات التطوير الرئيسية

| الموضوع | المسار |
|---------|--------|
| إعدادات Django | `backend/config/settings.py` |
| نماذج ومنطق التقارير | `backend/reports/models.py`، `views.py`، `serializers.py`، `pdf_utils.py` |
| Serializer المكالمات | `backend/calls/serializers.py` |
| مهام Celery | `backend/calls/tasks.py` |
| واجهة التقارير | `frontend/src/pages/Reports.jsx` |
| واجهة المتابعات | `frontend/src/pages/Followups.jsx` |
| مكوّن الصورة الرمزية | `frontend/src/ui-component/UserAvatarWithName.jsx` |
| الإشعارات | `frontend/src/layout/MainLayout/Header/NotificationSection/` |
| عميل HTTP | `frontend/src/api/api.js` |
| المصادقة | `frontend/src/contexts/AuthContext.jsx` |
| المسارات | `frontend/src/routes/MainRoutes.jsx` |

---

## 12. ملاحظات تقنية

1. قائمة التقارير تُرجع جميع السجلات في `data[]` دون pagination من DRF — التصفح يتم في الواجهة (6 عناصر لكل صفحة).
2. فلترة تقارير المدير: `status in (published, reviewed)` و `created_by.profile.role = qa`.
3. فلترة تقارير QA: `created_by = المستخدم الحالي` فقط.
4. حذف التقرير: QA + حالة draft + ملكية التقرير — الاستجابة عبر `success_response` وليس 204.
5. إجراء المراجعة `POST /approve/`: يضبط `status=reviewed` مع `reviewed_by` و `reviewed_at`.
6. إجراء `add-notes`: يحدّث `manager_notes` و `reviewed_by/at` دون تغيير الحالة إلى reviewed.
7. الوصول إلى ملف المستخدم الشخصي: `user.profile` (وليس `userprofile`).
8. WebSockets: Django Channels + Redis — مجموعة `call_{id}` لتحديثات معالجة المكالمات.
9. توليد PDF: يُفضَّل `reportlab` عند توفره؛ وإلا يعمل البديل الاحتياطي في `pdf_utils.py`.

---

## 13. سيناريو اختبار سريع

1. إنشاء حسابي manager و qa (إعادة تسجيل الدخول بعد أي تحديث على `/me/`)
2. **QA:** رفع مكالمة → تشغيل process → إنشاء تقرير → نشره
3. **Manager:** فتح Reports → View → Review / Add Notes / Download PDF
4. **QA:** التحقق من ظهور Manager Notes والإشعار في الشريط العلوي
5. **QA:** محاولة الحذف على draft (مسموح) وعلى published (معطّل)
6. **Manager:** التأكد من عدم ظهور أي تقرير بحالة draft

---
