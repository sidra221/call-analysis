from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta

from calls.models import Call, CallAnalysis, FollowUp
from accounts.permissions import IsManagerOrQA
from config.responses import success_response, error_response


class DashboardOverviewView(APIView):
    """
    Returns a high-level summary of call statistics and top keywords.
    Intended as the main landing view for the dashboard.
    GET /api/dashboard/
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        """Aggregate call counts, average sentiment score, and top keywords."""
        try:
            total_calls = Call.objects.count()
            completed_calls = Call.objects.filter(status='completed').count()
            failed_calls = Call.objects.filter(status='failed').count()
            pending_calls = Call.objects.filter(status='pending').count()

            avg_sentiment_score = CallAnalysis.objects.aggregate(
                avg_score=Avg('sentiment_score')
            )['avg_score'] or 0

            # Use raw PostgreSQL to unnest the keywords JSONB array and count occurrences
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


class DashboardSummaryView(APIView):
    """
    Returns detailed statistics including sentiment breakdown,
    priority distribution, follow-up rates, and time-based call counts.
    GET /api/dashboard/summary/
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        """Compute and return full dashboard statistics."""

        # --- Call status counts ---
        total_calls = Call.objects.count()
        completed_calls = Call.objects.filter(status='completed').count()
        pending_calls = Call.objects.filter(status='pending').count()
        processing_calls = Call.objects.filter(status='processing').count()
        failed_calls = Call.objects.filter(status='failed').count()

        # --- Sentiment distribution ---
        sentiment_stats = CallAnalysis.objects.values('sentiment').annotate(count=Count('id'))
        sentiment_dict = {item['sentiment']: item['count'] for item in sentiment_stats}
        positive_count = sentiment_dict.get('positive', 0)
        negative_count = sentiment_dict.get('negative', 0)
        neutral_count = sentiment_dict.get('neutral', 0)

        # --- Priority distribution ---
        priority_stats = CallAnalysis.objects.values('priority').annotate(count=Count('id'))
        priority_dict = {item['priority']: item['count'] for item in priority_stats}
        high_priority = priority_dict.get('high', 0)
        medium_priority = priority_dict.get('medium', 0)
        low_priority = priority_dict.get('low', 0)

        # --- Follow-up statistics ---
        needs_followup = CallAnalysis.objects.filter(needs_followup=True).count()
        total_followups = FollowUp.objects.count()

        # --- Average sentiment score ---
        avg_sentiment_score = CallAnalysis.objects.aggregate(
            avg_score=Avg('sentiment_score')
        )['avg_score'] or 0

        # --- Time-based call counts ---
        today = timezone.now().date()
        calls_last_7_days = Call.objects.filter(
            created_at__date__gte=today - timedelta(days=7)
        ).count()
        calls_last_30_days = Call.objects.filter(
            created_at__date__gte=today - timedelta(days=30)
        ).count()

        # --- Distinct uploaders ---
        total_users = Call.objects.values('uploaded_by').distinct().count()

        # --- Rates ---
        completion_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
        followup_rate = (needs_followup / completed_calls * 100) if completed_calls > 0 else 0

        return success_response({
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
            },
        })


class DashboardTopicsView(APIView):
    """
    Returns topic-level analysis: top recurring issues, top keywords,
    and the most frequent positive and negative issues.
    GET /api/dashboard/topics/
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        """Aggregate and return topic statistics from call analyses."""

        # Top 10 most repeated issues with sentiment breakdown
        topics = CallAnalysis.objects.values('main_issue').annotate(
            count=Count('id'),
            positive_count=Count('id', filter=Q(sentiment='positive')),
            negative_count=Count('id', filter=Q(sentiment='negative')),
            neutral_count=Count('id', filter=Q(sentiment='neutral')),
        ).order_by('-count')[:10]

        topics_list = [
            {
                'topic': topic['main_issue'],
                'total_count': topic['count'],
                'positive': topic['positive_count'],
                'negative': topic['negative_count'],
                'neutral': topic['neutral_count'],
            }
            for topic in topics
        ]

        # Top 10 keywords extracted from JSONB using raw PostgreSQL
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

        # Top 5 most frequent negative issues
        negative_issues = (
            CallAnalysis.objects
            .filter(sentiment='negative')
            .values('main_issue')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        # Top 5 most frequent positive issues
        positive_issues = (
            CallAnalysis.objects
            .filter(sentiment='positive')
            .values('main_issue')
            .annotate(count=Count('id'))
            .order_by('-count')[:5]
        )

        return success_response({
            'top_topics': topics_list,
            'top_keywords': keywords_list,
            'negative_issues': list(negative_issues),
            'positive_issues': list(positive_issues),
        })


class LiveDemoView(APIView):
    """
    Returns the 5 most recently uploaded calls with their sentiment.
    Useful for a live feed widget on the dashboard.
    GET /api/dashboard/live/
    """

    permission_classes = [IsAuthenticated, IsManagerOrQA]

    def get(self, request):
        """Fetch and return the latest 5 calls with status and sentiment."""
        try:
            calls = Call.objects.select_related('analysis').order_by('-created_at')[:5]
            data = [
                {
                    'id': c.id,
                    'status': c.status,
                    # Safely access sentiment — analysis may not exist yet
                    'sentiment': c.analysis.sentiment if hasattr(c, 'analysis') and c.analysis else None,
                    'created_at': c.created_at,
                }
                for c in calls
            ]
            return success_response({'latest_calls': data})

        except Exception as exc:
            return error_response(str(exc), code="live_demo_error", status_code=500)