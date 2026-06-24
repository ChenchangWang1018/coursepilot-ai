import logging
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .chat import ChatHistoryMessage, answer_document_question
from .document_store import get_document, save_document
from .pdf import extract_pdf_text
from .quiz import generate_quiz
from .summary import generate_study_summary

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="CoursePilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    document_id: str
    question: str
    chat_history: list[ChatHistoryMessage] = Field(default_factory=list)
    answer_mode: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat")
def chat(request: ChatRequest) -> dict[str, str | list[str]]:
    document_id = request.document_id.strip()
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    document = get_document(document_id)
    if document is None:
        raise HTTPException(status_code=404, detail="Document was not found.")

    try:
        logger.info(
            "CHAT_ANSWER_STARTED document_id=%s question_chars=%d history_messages=%d",
            document_id,
            len(question),
            min(len(request.chat_history), 6),
        )
        response = answer_document_question(
            document.text,
            question,
            request.chat_history[-6:],
            request.answer_mode,
        )
        logger.info("CHAT_ANSWER_SUCCEEDED document_id=%s", document_id)
        return response
    except ValueError as exc:
        logger.exception(
            "CHAT_ANSWER_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception(
            "CHAT_ANSWER_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(
            "CHAT_ANSWER_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(status_code=500, detail="Tutor answer generation failed.") from exc


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
        logger.info("DOCUMENT_STORE_SAVE_STARTED filename=%r", filename)
        document_id = save_document(
            filename=filename,
            text=full_text,
            metadata={"num_pages": num_pages},
        )
        logger.info(
            "DOCUMENT_STORE_SAVE_SUCCEEDED filename=%r document_id=%s",
            filename,
            document_id,
        )
    except Exception as exc:
        logger.exception(
            "DOCUMENT_STORE_SAVE_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise HTTPException(
            status_code=500,
            detail="Could not store document for tutoring.",
        ) from exc

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
            "document_id": document_id,
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
