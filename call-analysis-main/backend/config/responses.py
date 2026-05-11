from rest_framework.response import Response
from rest_framework import status


def success_response(data, status_code: int = status.HTTP_200_OK) -> Response:
    """
    Return a standardized success response.
    All successful API responses follow this structure:
    { "success": true, "data": <payload>, "error": null }
    """
    return Response({"success": True, "data": data, "error": None}, status=status_code)


def error_response(
    message: str,
    code: str = "error",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    extra=None
) -> Response:
    """
    Return a standardized error response.
    All failed API responses follow this structure:
    { "success": false, "data": null, "error": { "message": ..., "code": ... } }

    The optional 'extra' dict can be used to attach additional context to the error.
    """
    err = {"message": message, "code": code}
    if extra:
        err.update(extra)
    return Response({"success": False, "data": None, "error": err}, status=status_code)