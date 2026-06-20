import logging
import os

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field

MAX_CHAT_CONTEXT_CHARS = 14000
OPENAI_MODEL = "gpt-5.5"

logger = logging.getLogger(__name__)


class TutorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str
    suggested_followups: list[str] = Field(min_length=2, max_length=4)


def answer_document_question(document_text: str, question: str) -> dict[str, str | list[str]]:
    if not document_text.strip():
        raise ValueError("The stored document has no text to answer from.")

    if not question.strip():
        raise ValueError("Question cannot be empty.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    context = document_text[:MAX_CHAT_CONTEXT_CHARS]
    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", OPENAI_MODEL),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a patient course tutor. Answer using the uploaded "
                        "document as the main source. Explain concepts step by step. "
                        "If the document does not contain enough information, say that "
                        "clearly instead of inventing details. You may use general CS "
                        "knowledge only to explain concepts already present in the "
                        "document. Return only the requested structured JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Uploaded document context:\n"
                        f"{context}\n\n"
                        "Student question:\n"
                        f"{question.strip()}\n\n"
                        "Answer the question and suggest 2 to 4 useful follow-up "
                        "questions grounded in the uploaded material."
                    ),
                },
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "tutor_response",
                    "schema": TutorResponse.model_json_schema(),
                    "strict": True,
                }
            },
        )
        return TutorResponse.model_validate_json(response.output_text).model_dump()
    except OpenAIError as exc:
        logger.exception(
            "OpenAI tutor answer generation failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("Tutor answer generation failed.") from exc
    except ValueError as exc:
        logger.exception(
            "OpenAI tutor response validation failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("Tutor answer generation failed.") from exc
