from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from calls.models import Call, CallAnalysis, FollowUp
from accounts.permissions import IsManagerOrQA
from config.responses import success_response, error_response


class DashboardSummaryView(APIView):
    """
    ملخص إحصائيات Dashboard
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        # إحصائيات عامة
        total_calls = Call.objects.count()
        completed_calls = Call.objects.filter(status='completed').count()
        pending_calls = Call.objects.filter(status='pending').count()
        processing_calls = Call.objects.filter(status='processing').count()
        failed_calls = Call.objects.filter(status='failed').count()

        # إحصائيات Sentiment
        sentiment_stats = CallAnalysis.objects.values('sentiment').annotate(
            count=Count('id')
        )
        sentiment_dict = {item['sentiment']: item['count'] for item in sentiment_stats}
        
        positive_count = sentiment_dict.get('positive', 0)
        negative_count = sentiment_dict.get('negative', 0)
        neutral_count = sentiment_dict.get('neutral', 0)

        # إحصائيات Priority
        priority_stats = CallAnalysis.objects.values('priority').annotate(
            count=Count('id')
        )
        priority_dict = {item['priority']: item['count'] for item in priority_stats}
        
        high_priority = priority_dict.get('high', 0)
        medium_priority = priority_dict.get('medium', 0)
        low_priority = priority_dict.get('low', 0)

        # إحصائيات Follow-up
        needs_followup = CallAnalysis.objects.filter(needs_followup=True).count()
        total_followups = FollowUp.objects.count()

        # متوسط Sentiment Score
        avg_sentiment_score = CallAnalysis.objects.aggregate(
            avg_score=Avg('sentiment_score')
        )['avg_score'] or 0

        # إحصائيات حسب الفترة الزمنية
        today = timezone.now().date()
        last_7_days = today - timedelta(days=7)
        last_30_days = today - timedelta(days=30)

        calls_last_7_days = Call.objects.filter(
            created_at__date__gte=last_7_days
        ).count()

        calls_last_30_days = Call.objects.filter(
            created_at__date__gte=last_30_days
        ).count()

        # إحصائيات حسب المستخدمين
        total_users = Call.objects.values('uploaded_by').distinct().count()

        # نسبة المكالمات المكتملة
        completion_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0

        # نسبة المكالمات التي تحتاج متابعة
        followup_rate = (needs_followup / completed_calls * 100) if completed_calls > 0 else 0

        return Response({
            'overview': {
                'total_calls': total_calls,
                'completed_calls': completed_calls,
                'pending_calls': pending_calls,
                'processing_calls': processing_calls,
                'failed_calls': failed_calls,
                'completion_rate': round(completion_rate, 2),
            },
            'sentiment': {
                'positive': positive_count,
                'negative': negative_count,
                'neutral': neutral_count,
                'total': positive_count + negative_count + neutral_count,
                'average_score': round(avg_sentiment_score, 2),
            },
            'priority': {
                'high': high_priority,
                'medium': medium_priority,
                'low': low_priority,
                'total': high_priority + medium_priority + low_priority,
            },
            'follow_ups': {
                'needs_followup': needs_followup,
                'total_followups': total_followups,
                'followup_rate': round(followup_rate, 2),
            },
            'time_periods': {
                'last_7_days': calls_last_7_days,
                'last_30_days': calls_last_30_days,
            },
            'users': {
                'total_users': total_users,
            }
        })


class DashboardTopicsView(APIView):
    """
    المواضيع والمشاكل الرئيسية
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        # الحصول على المواضيع الأكثر تكراراً
        topics = CallAnalysis.objects.values('main_issue').annotate(
            count=Count('id'),
            positive_count=Count('id', filter=Q(sentiment='positive')),
            negative_count=Count('id', filter=Q(sentiment='negative')),
            neutral_count=Count('id', filter=Q(sentiment='neutral')),
        ).order_by('-count')[:10]

        topics_list = []
        for topic in topics:
            topics_list.append({
                'topic': topic['main_issue'],
                'total_count': topic['count'],
                'positive': topic['positive_count'],
                'negative': topic['negative_count'],
                'neutral': topic['neutral_count'],
            })

        # الكلمات المفتاحية الأكثر استخداماً (SQL optimized on PostgreSQL)
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT LOWER(elem) AS keyword, COUNT(*) AS cnt
                FROM (
                    SELECT jsonb_array_elements_text(keywords) AS elem
                    FROM calls_callanalysis
                    WHERE keywords IS NOT NULL
                ) t
                GROUP BY LOWER(elem)
                ORDER BY cnt DESC
                LIMIT 10
            """)
            rows = cursor.fetchall()
            keywords_list = [{'keyword': r[0], 'count': r[1]} for r in rows]

        # المشاكل الأكثر تكراراً (negative sentiment)
        negative_issues = CallAnalysis.objects.filter(
            sentiment='negative'
        ).values('main_issue').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        negative_issues_list = [
            {'issue': item['main_issue'], 'count': item['count']}
            for item in negative_issues
        ]

        # المواضيع الإيجابية الأكثر تكراراً
        positive_issues = CallAnalysis.objects.filter(
            sentiment='positive'
        ).values('main_issue').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        positive_issues_list = [
            {'issue': item['main_issue'], 'count': item['count']}
            for item in positive_issues
        ]

        return Response({
            'top_topics': topics_list,
            'top_keywords': keywords_list,
            'negative_issues': negative_issues_list,
            'positive_issues': positive_issues_list,
        })


class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        try:
            total_calls = Call.objects.count()
            completed_calls = Call.objects.filter(status='completed').count()
            failed_calls = Call.objects.filter(status='failed').count()
            pending_calls = Call.objects.filter(status='pending').count()
            avg_sentiment_score = CallAnalysis.objects.aggregate(
                avg_score=Avg('sentiment_score')
            )['avg_score'] or 0

            # top 10 keywords optimized
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT LOWER(elem) AS keyword, COUNT(*) AS cnt
                    FROM (
                        SELECT jsonb_array_elements_text(keywords) AS elem
                        FROM calls_callanalysis
                        WHERE keywords IS NOT NULL
                    ) t
                    GROUP BY LOWER(elem)
                    ORDER BY cnt DESC
                    LIMIT 10
                """)
                rows = cursor.fetchall()
                top_keywords = [{'keyword': r[0], 'count': r[1]} for r in rows]

            data = {
                'total_calls': total_calls,
                'completed_calls': completed_calls,
                'failed_calls': failed_calls,
                'pending_calls': pending_calls,
                'average_sentiment_score': round(float(avg_sentiment_score), 2),
                'top_keywords': top_keywords,
            }
            return success_response(data)
        except Exception as exc:
            return error_response(str(exc), code="dashboard_error", status_code=500)


class LiveDemoView(APIView):
    """
    GET /api/dashboard/live/
    """
    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        try:
            calls = Call.objects.select_related('analysis').order_by('-created_at')[:5]
            data = []
            for c in calls:
                sentiment = None
                if hasattr(c, 'analysis') and c.analysis:
                    sentiment = c.analysis.sentiment
                data.append({
                    'id': c.id,
                    'status': c.status,
                    'sentiment': sentiment,
                    'created_at': c.created_at,
                })
            return success_response({'latest_calls': data})
        except Exception as exc:
            return error_response(str(exc), code="live_demo_error", status_code=500)

