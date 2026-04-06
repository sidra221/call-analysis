from rest_framework.views import exception_handler
from rest_framework import status
from .responses import error_response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data
        message = ""
        if isinstance(detail, dict) and 'detail' in detail:
            message = str(detail['detail'])
        elif isinstance(detail, dict):
            message = "; ".join([f"{k}: {v}" for k, v in detail.items()])
        else:
            message = str(detail)
        return error_response(message=message, code="api_error", status_code=response.status_code)
    # Unhandled -> 500
    return error_response(message="Internal server error", code="internal_error", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

