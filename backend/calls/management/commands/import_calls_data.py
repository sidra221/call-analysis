from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from calls.models import Call, CallAnalysis
from accounts.models import UserProfile
from django.core.files.base import ContentFile
from datetime import timedelta
from django.utils import timezone
import random
import json

# البيانات المحددة
CALLS_DATA = [
    {
        "call_id": "CALL_001",
        "transcript": "الموظف: صباح الخير، شركة الاتصالات.\nالعميل: صباح النور، حابب أعرف تفاصيل باقة الإنترنت الجديدة.\nالموظف: في عنا باقة 100 جيجابايت.\nالعميل: ممتاز، شكراً."
    },
    {
        "call_id": "CALL_002",
        "transcript": "الموظف: كيف أقدر أساعدك؟\nالعميل: الفاتورة هالشهر مرتفعة جداً.\nالموظف: خلينا نراجع الحساب.\nالعميل: تم خصم المبلغ مرتين."
    },
    {
        "call_id": "CALL_003",
        "transcript": "الموظف: تفضل.\nالعميل: الإنترنت بطيء وينقطع باستمرار.\nالموظف: من أي منطقة؟\nالعميل: المشكلة مستمرة من أسبوع."
    },
    {
        "call_id": "CALL_004",
        "transcript": "الموظف: أهلاً فيك.\nالعميل: متى موعد تجديد الباقة؟\nالموظف: بتاريخ 25 من كل شهر.\nالعميل: شكراً."
    },
    {
        "call_id": "CALL_005",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: الشريحة الجديدة ما وصلتني.\nالموظف: متى قدمت الطلب؟\nالعميل: من عشرة أيام."
    },
    {
        "call_id": "CALL_006",
        "transcript": "الموظف: أهلاً وسهلاً.\nالعميل: حابب أشكركم على حل المشكلة السابقة.\nالموظف: هذا واجبنا.\nالعميل: الخدمة ممتازة."
    },
    {
        "call_id": "CALL_007",
        "transcript": "الموظف: تفضل.\nالعميل: للمرة الثالثة عم اتصل بسبب خطأ بالفاتورة.\nالموظف: رح نراجع الموضوع.\nالعميل: نفس المشكلة كل شهر."
    },
    {
        "call_id": "CALL_008",
        "transcript": "الموظف: كيف فيني أساعدك؟\nالعميل: بدي أعرف الرصيد المتبقي.\nالموظف: عندك 15 جيجابايت.\nالعميل: تمام."
    },
    {
        "call_id": "CALL_009",
        "transcript": "الموظف: شركة الاتصالات.\nالعميل: المكالمات تنقطع فجأة.\nالموظف: سنفحص الشبكة.\nالعميل: هالشي عم يضايقني كثير."
    },
    {
        "call_id": "CALL_010",
        "transcript": "الموظف: أهلاً بك.\nالعميل: الباقة الجديدة ممتازة والسرعة عالية.\nالموظف: سعداء بسماع ذلك."
    },
    {
        "call_id": "CALL_011",
        "transcript": "الموظف: تفضل.\nالعميل: تم إضافة رسوم غريبة على الفاتورة.\nالموظف: سنراجع التفاصيل.\nالعميل: هذا غير مقبول."
    },
    {
        "call_id": "CALL_012",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: الإنترنت يفصل خاصة بالمساء.\nالموظف: سنسجل بلاغ.\nالعميل: الوضع سيئ."
    },
    {
        "call_id": "CALL_013",
        "transcript": "الموظف: أهلاً.\nالعميل: بدي أغير نوع الباقة.\nالموظف: متوفر عدة خيارات.\nالعميل: تمام."
    },
    {
        "call_id": "CALL_014",
        "transcript": "الموظف: كيف فيني أخدمك؟\nالعميل: الشحن تأخر عن الموعد.\nالموظف: سنراجع الطلب.\nالعميل: صارلي أسبوع ناطر."
    },
    {
        "call_id": "CALL_015",
        "transcript": "الموظف: أهلاً وسهلاً.\nالعميل: شكراً على سرعة الرد.\nالموظف: على الرحب."
    },
    {
        "call_id": "CALL_016",
        "transcript": "الموظف: تفضل.\nالعميل: تم خصم رسوم اشتراك لم أطلبها.\nالموظف: سنراجع الحساب.\nالعميل: أريد حل فوراً."
    },
    {
        "call_id": "CALL_017",
        "transcript": "الموظف: كيف أقدر أساعدك؟\nالعميل: الشبكة ضعيفة داخل المنزل.\nالموظف: سنقترح مقوي إشارة.\nالعميل: أتمنى يتحسن الوضع."
    },
    {
        "call_id": "CALL_018",
        "transcript": "الموظف: أهلاً.\nالعميل: متى تنتهي صلاحية العرض؟\nالموظف: نهاية الشهر.\nالعميل: شكراً."
    },
    {
        "call_id": "CALL_019",
        "transcript": "الموظف: تفضل.\nالعميل: الإنترنت بطيء جداً اليوم.\nالموظف: سنفحص الخط.\nالعميل: هذا يؤثر على عملي."
    },
    {
        "call_id": "CALL_020",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: الخدمة تحسنت عن قبل.\nالموظف: يسعدنا ذلك."
    },
    {
        "call_id": "CALL_021",
        "transcript": "الموظف: أهلاً.\nالعميل: الفاتورة أعلى من المعتاد.\nالموظف: سنراجع الاستخدام.\nالعميل: أريد تفسير واضح."
    },
    {
        "call_id": "CALL_022",
        "transcript": "الموظف: تفضل.\nالعميل: الإنترنت ينقطع كل مساء.\nالموظف: سنرفع بلاغ.\nالعميل: أتمنى حل نهائي."
    },
    {
        "call_id": "CALL_023",
        "transcript": "الموظف: كيف أقدر أساعدك؟\nالعميل: أريد تفعيل باقة إضافية.\nالموظف: تم."
    },
    {
        "call_id": "CALL_024",
        "transcript": "الموظف: أهلاً.\nالعميل: الشريحة لم تعمل بعد التفعيل.\nالموظف: سنراجع الإعدادات.\nالعميل: هذا مزعج."
    },
    {
        "call_id": "CALL_025",
        "transcript": "الموظف: تفضل.\nالعميل: شكراً على تعاونكم.\nالموظف: هذا واجبنا."
    },
    {
        "call_id": "CALL_026",
        "transcript": "الموظف: كيف فيني أساعدك؟\nالعميل: خصم غير مبرر بالفاتورة.\nالموظف: سنحقق بالأمر.\nالعميل: أريد استرجاع المبلغ."
    },
    {
        "call_id": "CALL_027",
        "transcript": "الموظف: أهلاً.\nالعميل: الإنترنت ضعيف بالإشارة.\nالموظف: سنفحص المنطقة.\nالعميل: المشكلة متكررة."
    },
    {
        "call_id": "CALL_028",
        "transcript": "الموظف: تفضل.\nالعميل: بدي أغير رقم الهاتف.\nالموظف: ممكن.\nالعميل: شكراً."
    },
    {
        "call_id": "CALL_029",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: طلبت شريحة جديدة ولم تصل.\nالموظف: سنراجع الطلب.\nالعميل: صارلي مدة ناطر."
    },
    {
        "call_id": "CALL_030",
        "transcript": "الموظف: أهلاً.\nالعميل: الخدمة ممتازة حالياً.\nالموظف: يسعدنا سماع ذلك."
    },
    {
        "call_id": "CALL_031",
        "transcript": "الموظف: تفضل.\nالعميل: رسوم إضافية بدون سبب.\nالموظف: سنراجع الفاتورة.\nالعميل: أريد تفسير."
    },
    {
        "call_id": "CALL_032",
        "transcript": "الموظف: كيف فيني أساعدك؟\nالعميل: الإنترنت بطيء وقت الذروة.\nالموظف: سنرفع شكوى.\nالعميل: أتمنى حل."
    },
    {
        "call_id": "CALL_033",
        "transcript": "الموظف: أهلاً.\nالعميل: بدي أستفسر عن عرض جديد.\nالموظف: العرض متوفر.\nالعميل: ممتاز."
    },
    {
        "call_id": "CALL_034",
        "transcript": "الموظف: تفضل.\nالعميل: الشحن تأخر أكثر من اللازم.\nالموظف: سنراجع الشركة الناقلة.\nالعميل: هذا غير مقبول."
    },
    {
        "call_id": "CALL_035",
        "transcript": "الموظف: أهلاً.\nالعميل: شكراً على المتابعة.\nالموظف: على الرحب."
    },
    {
        "call_id": "CALL_036",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: خصم رسوم إضافية.\nالموظف: سنحقق بالأمر.\nالعميل: أنتظر حل."
    },
    {
        "call_id": "CALL_037",
        "transcript": "الموظف: أهلاً.\nالعميل: الإنترنت غير مستقر.\nالموظف: سنفتح بلاغ.\nالعميل: أتمنى عدم التكرار."
    },
    {
        "call_id": "CALL_038",
        "transcript": "الموظف: تفضل.\nالعميل: أريد معرفة العروض الحالية.\nالموظف: سأشرحها لك.\nالعميل: شكراً."
    },
    {
        "call_id": "CALL_039",
        "transcript": "الموظف: كيف أقدر أساعدك؟\nالعميل: الشريحة لا تعمل.\nالموظف: سنعيد تفعيلها.\nالعميل: أتمنى تنحل."
    },
    {
        "call_id": "CALL_040",
        "transcript": "الموظف: أهلاً.\nالعميل: الخدمة جيدة حالياً.\nالموظف: يسعدنا ذلك."
    },
    {
        "call_id": "CALL_041",
        "transcript": "الموظف: تفضل.\nالعميل: خطأ متكرر بالفاتورة.\nالموظف: سنراجع الحساب.\nالعميل: هذا صار مزعج."
    },
    {
        "call_id": "CALL_042",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: الإنترنت ضعيف جداً.\nالموظف: سنرفع بلاغ.\nالعميل: أحتاج حل سريع."
    },
    {
        "call_id": "CALL_043",
        "transcript": "الموظف: أهلاً.\nالعميل: أريد ترقية الباقة.\nالموظف: متاح.\nالعميل: تمام."
    },
    {
        "call_id": "CALL_044",
        "transcript": "الموظف: تفضل.\nالعميل: الشحن لم يتم حتى الآن.\nالموظف: سنراجع الطلب.\nالعميل: التأخير غير مقبول."
    },
    {
        "call_id": "CALL_045",
        "transcript": "الموظف: أهلاً.\nالعميل: شكراً على حسن الخدمة.\nالموظف: هذا واجبنا."
    },
    {
        "call_id": "CALL_046",
        "transcript": "الموظف: كيف أقدر أساعدك؟\nالعميل: رسوم إضافية بالفاتورة.\nالموظف: سنراجع التفاصيل.\nالعميل: أريد حل نهائي."
    },
    {
        "call_id": "CALL_047",
        "transcript": "الموظف: أهلاً.\nالعميل: الإنترنت بطيء اليوم.\nالموظف: سنفحص الشبكة.\nالعميل: أتمنى يتحسن."
    },
    {
        "call_id": "CALL_048",
        "transcript": "الموظف: تفضل.\nالعميل: بدي أوقف خدمة مؤقتاً.\nالموظف: تم.\nالعميل: شكراً."
    },
    {
        "call_id": "CALL_049",
        "transcript": "الموظف: كيف أساعدك؟\nالعميل: الشريحة لم تصل بعد.\nالموظف: سنراجع الشحن.\nالعميل: التأخير مزعج."
    },
    {
        "call_id": "CALL_050",
        "transcript": "الموظف: أهلاً.\nالعميل: الخدمة ممتازة الآن.\nالموظف: يسعدنا رضاك."
    }
]


class Command(BaseCommand):
    help = 'Import calls data from predefined list'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 بدء استيراد البيانات...'))

        # الحصول على مستخدمين موجودين أو إنشاء واحد
        users = list(User.objects.filter(userprofile__isnull=False))
        if not users:
            # إنشاء مستخدم افتراضي
            user = User.objects.create_user(
                username='admin_user',
                email='admin@test.com',
                password='password123'
            )
            UserProfile.objects.create(user=user, role='manager')
            users = [user]
            self.stdout.write('  ✓ تم إنشاء مستخدم افتراضي')

        calls_created = 0
        analyses_created = 0

        for call_data in CALLS_DATA:
            call_id = call_data['call_id']
            transcript = call_data['transcript']

            # تحليل sentiment من النص
            sentiment, sentiment_score, main_issue, keywords, priority, needs_followup = self.analyze_transcript(transcript)

            # توزيع عشوائي للتواريخ (آخر 90 يوم)
            days_ago = random.randint(0, 90)
            created_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

            # إنشاء ملف صوتي وهمي
            audio_content = b'\xff\xfb\x90\x00'  # MP3 header
            audio_file = ContentFile(audio_content, name=f'{call_id}.mp3')

            # إنشاء Call
            call = Call.objects.create(
                uploaded_by=random.choice(users),
                audio_file=audio_file,
                status='completed',
                created_at=created_at
            )
            calls_created += 1

            # إنشاء CallAnalysis
            analysis = CallAnalysis.objects.create(
                call=call,
                transcript=transcript,
                sentiment=sentiment,
                sentiment_score=sentiment_score,
                main_issue=main_issue,
                keywords=keywords,
                needs_followup=needs_followup,
                priority=priority,
                analyzed_at=created_at + timedelta(hours=random.randint(1, 24))
            )
            analyses_created += 1

            self.stdout.write(f'  ✓ {call_id}: {sentiment} - {main_issue}')

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ تم استيراد البيانات بنجاح:\n'
                f'  📞 {calls_created} مكالمة\n'
                f'  📊 {analyses_created} تحليل\n'
            )
        )

    def analyze_transcript(self, transcript):
        """تحليل النص وتحديد sentiment والمعلومات الأخرى"""
        transcript_lower = transcript.lower()

        # كلمات إيجابية
        positive_words = ['شكراً', 'ممتاز', 'جيدة', 'ممتازة', 'رائع', 'يسعدنا', 'تحسنت', 'حسن الخدمة', 'تمام']
        
        # كلمات سلبية
        negative_words = ['بطيء', 'ينقطع', 'مشكلة', 'مزعج', 'سيئ', 'ضعيف', 'غير مقبول', 'خطأ', 'تأخر', 'مزعج', 'مضايقني', 'يضايقني']
        
        # كلمات محايدة
        neutral_words = ['استفسار', 'أعرف', 'متى', 'بدي', 'أريد', 'معرفة', 'تفاصيل']

        # حساب النقاط
        positive_count = sum(1 for word in positive_words if word in transcript_lower)
        negative_count = sum(1 for word in negative_words if word in transcript_lower)
        neutral_count = sum(1 for word in neutral_words if word in transcript_lower)

        # تحديد sentiment
        if negative_count > positive_count and negative_count > 0:
            sentiment = 'negative'
            sentiment_score = round(random.uniform(0.0, 0.35), 2)
            priority = random.choice(['medium', 'high', 'high'])  # 66% high
            needs_followup = random.choice([True, True, True, False])  # 75%
        elif positive_count > negative_count and positive_count > 0:
            sentiment = 'positive'
            sentiment_score = round(random.uniform(0.65, 1.0), 2)
            priority = random.choice(['low', 'medium'])
            needs_followup = random.choice([True, False, False, False])  # 25%
        else:
            sentiment = 'neutral'
            sentiment_score = round(random.uniform(0.40, 0.60), 2)
            priority = random.choice(['low', 'medium'])
            needs_followup = random.choice([True, False, False, False])  # 25%

        # تحديد main_issue
        if 'فاتورة' in transcript_lower or 'رسوم' in transcript_lower or 'خصم' in transcript_lower:
            main_issue = 'مشكلة في الفاتورة'
            keywords = ['فاتورة', 'رسوم', 'دفع']
        elif 'إنترنت' in transcript_lower or 'بطيء' in transcript_lower or 'ينقطع' in transcript_lower or 'ضعيف' in transcript_lower:
            main_issue = 'مشكلة في الإنترنت'
            keywords = ['إنترنت', 'سرعة', 'اتصال']
        elif 'شريحة' in transcript_lower or 'شحن' in transcript_lower:
            main_issue = 'مشكلة في الشريحة أو الشحن'
            keywords = ['شريحة', 'شحن', 'توصيل']
        elif 'باقة' in transcript_lower or 'عرض' in transcript_lower:
            main_issue = 'استفسار عن الباقات'
            keywords = ['باقة', 'عرض', 'اشتراك']
        elif 'شكراً' in transcript_lower or 'ممتاز' in transcript_lower or 'جيدة' in transcript_lower:
            main_issue = 'شكر وتقدير'
            keywords = ['شكر', 'رضا', 'خدمة']
        else:
            main_issue = 'استفسار عام'
            keywords = ['استفسار', 'معلومات']

        return sentiment, sentiment_score, main_issue, keywords, priority, needs_followup

