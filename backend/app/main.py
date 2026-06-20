import logging
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware

from app.pdf import extract_pdf_text
from app.quiz import generate_quiz
from app.summary import generate_study_summary

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="CoursePilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
) -> dict[str, Any]:
    filename = file.filename or "uploaded.pdf"

    try:
        logger.info(
            "PDF_VALIDATION_STARTED filename=%r content_type=%r",
            filename,
            file.content_type,
        )
        if (
            file.content_type != "application/pdf"
            and not filename.lower().endswith(".pdf")
        ):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        file_bytes = await file.read()
        logger.info(
            "PDF_VALIDATION_SUCCEEDED filename=%r size_bytes=%d",
            filename,
            len(file_bytes),
        )
    except HTTPException as exc:
        logger.exception(
            "PDF_VALIDATION_FAILED: %s: %s",
            type(exc).__name__,
            exc.detail,
        )
        raise
    except Exception as exc:
        logger.exception(
            "PDF_VALIDATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise

    try:
        logger.info("PDF_EXTRACTION_STARTED filename=%r", filename)
        num_pages, full_text = extract_pdf_text(file_bytes)
        logger.info(
            "PDF_EXTRACTION_SUCCEEDED filename=%r num_pages=%d text_chars=%d",
            filename,
            num_pages,
            len(full_text),
        )
    except ValueError as exc:
        logger.exception(
            "PDF_EXTRACTION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(
            "PDF_EXTRACTION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise

    try:
        logger.info(
            "SUMMARY_GENERATION_STARTED filename=%r text_chars=%d",
            filename,
            len(full_text),
        )
        summary = generate_study_summary(full_text)
        logger.info("SUMMARY_GENERATION_SUCCEEDED filename=%r", filename)
    except ValueError as exc:
        logger.exception(
            "SUMMARY_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception(
            "SUMMARY_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(
            "SUMMARY_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise

    try:
        logger.info(
            "QUIZ_GENERATION_STARTED filename=%r text_chars=%d",
            filename,
            len(full_text),
        )
        quiz = generate_quiz(full_text)
        logger.info("QUIZ_GENERATION_SUCCEEDED filename=%r", filename)
    except ValueError as exc:
        logger.exception(
            "QUIZ_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception(
            "QUIZ_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(
            "QUIZ_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise

    try:
        logger.info("RESPONSE_VALIDATION_STARTED filename=%r", filename)
        response = {
            "filename": filename,
            "num_pages": num_pages,
            "text_preview": full_text[:2000],
            "summary": summary,
            "quiz": quiz,
        }
        jsonable_encoder(response)
        logger.info("RESPONSE_VALIDATION_SUCCEEDED filename=%r", filename)
        return response
    except Exception as exc:
        logger.exception(
            "RESPONSE_VALIDATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise
