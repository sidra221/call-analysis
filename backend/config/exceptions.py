from rest_framework.views import exception_handler
from rest_framework import status
from .responses import error_response


def custom_exception_handler(exc, context):
    """
    Global exception handler for all DRF views.
    Wraps DRF's default exception responses in the project's standardized
    error_response format so all API errors have a consistent structure.

    Handles:
    - Validation errors (400)
    - Authentication errors (401)
    - Permission errors (403)
    - Not found errors (404)
    - Any other DRF-recognized exception

    Unhandled exceptions (non-DRF errors) return a 500 internal server error.
    """
    # Let DRF process the exception first
    response = exception_handler(exc, context)

    if response is not None:
        detail = response.data
        # Extract a human-readable message from the response data
        if isinstance(detail, dict) and 'detail' in detail:
            message = str(detail['detail'])
        elif isinstance(detail, dict):
            message = "; ".join([f"{k}: {v}" for k, v in detail.items()])
        else:
            message = str(detail)

        return error_response(
            message=message,
            code="api_error",
            status_code=response.status_code
        )

    # Fallback for unhandled exceptions
    return error_response(
        message="Internal server error",
        code="internal_error",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )