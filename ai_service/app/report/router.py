from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging

from .service import ReportService
from .schemas import ReportRequest, normalize_analyses

router = APIRouter()
logger = logging.getLogger("report_router")


@router.post("/generate-report")
async def generate_report(payload: ReportRequest):
    """
    Generate AI report from multiple call analyses.
    POST /generate-report
    Body: { "analyses": [ { main_issue, sentiment, priority, keywords, transcript }, ... ] }
    Response: { "repeated_issues": [ { issue, count, priority, description, suggested_solution, related_keywords }, ... ] }
    """
    try:
        analyses = payload.analyses

        if not analyses:
            return JSONResponse({"repeated_issues": []}, status_code=200)

        # Convert Pydantic models to dicts
        analyses_dicts = [item.model_dump() for item in analyses]

        # Normalize input
        normalized = normalize_analyses(analyses_dicts)

        if not normalized:
            return JSONResponse({"repeated_issues": []}, status_code=200)

        # Generate report
        service = ReportService()
        result = service.generate(normalized)

        if not isinstance(result, dict):
            logger.error("Invalid response format.")
            return JSONResponse({"repeated_issues": []}, status_code=500)

        if "repeated_issues" not in result:
            logger.error("Missing repeated_issues in response.")
            return JSONResponse({"repeated_issues": []}, status_code=500)

        return JSONResponse(result, status_code=200)

    except HTTPException:
        raise

    except Exception as e:
        logger.exception(f"Unexpected router error: {str(e)}")
        return JSONResponse({"repeated_issues": []}, status_code=500)