from django.conf import settings

_ANALYZE_SUFFIXES = ('/analyze-call', '/analyze')


def ai_base_url() -> str:
    url = settings.AI_SERVICE_URL.rstrip('/')
    for suffix in _ANALYZE_SUFFIXES:
        if url.endswith(suffix):
            return url[: -len(suffix)]
    return url


def analyze_call_url() -> str:
    return f'{ai_base_url()}/analyze-call'


def generate_report_url() -> str:
    return f'{ai_base_url()}/generate-report'
