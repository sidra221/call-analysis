# مسار العرض — Call Analysis (Vocalys)

كل صفحة **مرة واحدة** وبالترتيب. لا ترجع لصفحة سبق عرضها.

## قواعد (ملاحظات العرض السابق)

1. **حسابان موظف (QA)** — المتابعات تُعطى لهما، مو للمدير.
2. **لا تشغّل الدارك** — ابقَ على الوضع الفاتح طوال العرض.
3. **العربية** — من أيقونة البروفايل بدّل EN ↔ AR. الألوان والاتجاه يتبدّلون، الثيم ما ينصدم.
4. **من Users: View Follow-ups** — يفتح متابعات **ذلك** الموظف (المعيَّن إليه).
5. **Logs** — فلتر على **شخص** (يوزر)، مو بس نوع الإجراء.
6. تنقّل القائمة بالترتيب، بدون تكرار.
7. **احذف مكالمة** (مدير).
8. **Last Login** محذوف من صفحة اليوزر — لا تذكره.
9. **أضف يوزر** جديد (مدير).
10. من الداش: **كارد أولوية واحد فوق** + **سطر واحد من Overview**.
11. على **Calls** وضّح الفلاتر (الحالة، الأولوية، المشاعر، المتابعة، التاريخ).

---

## قبل العرض

```bash
cd ~/Desktop/delete_me/call-analysis
./karabala.sh
```

| | الرابط |
|--|--------|
| الواجهة | http://localhost:3001 |

| الدور | يوزر | كلمة المرور |
|-------|------|-------------|
| QA | `employee` | كلمة المرور الحالية |
| QA | `employee2` | `Employee1234` |
| Manager | `admin` | `Admin1234` |

الرفع الحي: `analysis_test/call_recording_01.wav`

إذا `employee2` غير موجود: سجّل كـ `admin` → Users → Add User (دور QA) ثم اخرج. لا تبدأ العرض بدونه.

---

## جزء QA — `employee`

القائمة: Dashboard → Calls → Followups → Reports

### 1. Dashboard
1. Login → `employee`
2. كارد فوق: اضغط **Critical** (أو High) → Calls تتصّفى بالأولوية
3. رجوع للمتصفح **مرة واحدة**
4. Overview: اضغط **Needs Follow-up** (أو Negative) → Calls. **ابقَ هنا**

### 2. Calls
1. أيقونة الفلتر: مرّ على Status / Priority / Sentiment / Follow-up / التاريخ — Apply
2. Reset
3. **Upload Call** → `call_recording_01.wav` — انتظر `completed`
4. افتح المكالمة: Transcript / Analysis / Audio

### 3. Followups
1. **Create**
2. متابعة 1 → عيّن `employee`
3. **Create** مرة ثانية → عيّن `employee2`
4. لا تعيّن المدير

### 4. Reports
1. **Generate** → Monthly → **Publish**

### 5. لغة (من الهيدر، مو Settings)
1. البروفايل → Language → عربي ثم إنجليزي
2. الألوان تبقى — **لا تلمس الوضع الداكن**
3. Logout

---

## جزء Manager — `admin`

القائمة: Calls → Reports → Logs → Users  
لا تفتح Dashboard مرة ثانية. لا تفتح Settings.

### 1. Calls
1. Login → `admin` / `Admin1234`
2. اختر مكالمة قديمة (مو يلي انرفعت هلق) → حذف → أكّد

### 2. Reports
1. افتح التقرير **Published**
2. Notes + Download PDF

### 3. Logs
1. فلتر → حقل اليوزر → اختر `employee` → Apply
2. وضّح: السجل يظهر شغل هذا الشخص فقط

### 4. Users
1. **Add User** — QA جديد (مثلاً `employee3`)
2. افتح `employee` من القائمة
3. **View Follow-ups** → تظهر متابعاته هو (المعيَّن إليه)
4. خلص — لا Last Login، لا دارك

---

## مسار 5 دقائق

| # | ماذا |
|---|------|
| 1 | QA: Dashboard → Critical → رجوع → Overview Follow-up |
| 2 | Calls: فلتر سريع + رفع الملف |
| 3 | Followups: واحدة لـ `employee` وواحدة لـ `employee2` |
| 4 | Reports: Generate → Publish → Logout |
| 5 | Manager: حذف مكالمة → Logs فلتر شخص → Users أضف يوزر → View Follow-ups |

---

## أعطال أثناء العرض

| المشكلة | الحل |
|---------|------|
| المكالمة `processing` | `./karabala.sh --logs-ai` |
| الواجهة لا تفتح | `docker compose ps` |
