from rest_framework.response import Response
from rest_framework import status


def success_response(data, status_code: int = status.HTTP_200_OK) -> Response:
    return Response({"success": True, "data": data, "error": None}, status=status_code)


def error_response(message: str, code: str = "error", status_code: int = status.HTTP_400_BAD_REQUEST, extra=None) -> Response:
    err = {"message": message, "code": code}
    if extra:
        err.update(extra)
    return Response({"success": False, "data": None, "error": err}, status=status_code)

