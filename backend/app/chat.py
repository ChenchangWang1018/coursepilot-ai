import logging
from typing import Literal

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field

from .config import get_openai_api_key, get_openai_model

MAX_CHAT_CONTEXT_CHARS = 14000
MAX_CHAT_HISTORY_MESSAGES = 6

logger = logging.getLogger(__name__)


class ChatHistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str


AnswerMode = Literal["concise", "step_by_step", "exam_answer"]


class TutorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str
    suggested_followups: list[str] = Field(min_length=2, max_length=4)


def _format_chat_history(chat_history: list[ChatHistoryMessage] | None) -> str:
    if not chat_history:
        return "No prior conversation."

    recent_messages = [
        message
        for message in chat_history[-MAX_CHAT_HISTORY_MESSAGES:]
        if message.content.strip()
    ]
    if not recent_messages:
        return "No prior conversation."

    return "\n".join(
        f"{message.role}: {message.content.strip()}" for message in recent_messages
    )


def _normalize_answer_mode(answer_mode: str | None) -> AnswerMode:
    if answer_mode == "concise":
        return "concise"

    if answer_mode == "exam_answer":
        return "exam_answer"

    return "step_by_step"


def _get_answer_mode_instruction(answer_mode: AnswerMode) -> str:
    if answer_mode == "concise":
        return (
            "Answer in a short, direct way. Avoid long explanations. Use bullet "
            "points only when helpful. Target 3 to 6 sentences unless the question "
            "requires more. For math, physics, equations, formulas, proofs, or symbolic CS theory, use formulas only when they make the answer clearer."
        )

    if answer_mode == "exam_answer":
        return (
            "Provide a compact answer suitable for writing on an exam. Include proof "
            "templates or key steps when relevant. Avoid casual explanation. "
            "Prioritize correctness and concision. Use compact equations and proof templates when relevant."
        )

    return (
        "Explain the reasoning clearly. Break down concepts in order. Teach like a "
        "patient tutor while avoiding unnecessary length. Use formulas naturally in derivations when they clarify the reasoning."
    )


def answer_document_question(
    document_text: str,
    question: str,
    chat_history: list[ChatHistoryMessage] | None = None,
    answer_mode: str | None = None,
) -> dict[str, str | list[str]]:
    if not document_text.strip():
        raise ValueError("The stored document has no text to answer from.")

    if not question.strip():
        raise ValueError("Question cannot be empty.")

    context = document_text[:MAX_CHAT_CONTEXT_CHARS]
    formatted_chat_history = _format_chat_history(chat_history)
    normalized_answer_mode = _normalize_answer_mode(answer_mode)
    answer_mode_instruction = _get_answer_mode_instruction(normalized_answer_mode)
    client = OpenAI(api_key=get_openai_api_key())

    try:
        response = client.responses.create(
            model=get_openai_model(),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a patient course tutor. Answer using the uploaded "
                        "document as the main source. Explain concepts step by step. "
                        "If the document does not contain enough information, say that "
                        "clearly instead of inventing details. You may use general CS "
                        "knowledge only to explain concepts already present in the "
                        "document. Use recent chat history to resolve follow-up "
                        "references, but do not blindly repeat previous answers. If a "
                        "follow-up is ambiguous, ask a brief clarifying question. Return "
                        "only the requested structured JSON. Avoid overly long answers; "
                        "the student can ask follow-up questions for more detail. Use Markdown formatting. When explaining math, physics, equations, formulas, proofs, or symbolic CS theory, use LaTeX math by default. Use inline math exactly like $K=\\frac{1}{2}mv^2$. Use block math exactly with opening and closing double dollar signs on separate lines, with the equation between them. If an equation is important, prefer block math. Never write malformed math like $$K=\\frac{1}{2}mv^2$, $$a_c=\\frac{v^2}{r}$, or $T$$$. Avoid \\[...\\] and \\(...\\) delimiters. Never put dollar delimiters inside \\left or \\right; write \\left( ... \\right), not \\left$ ... \\right$. When defining variables, use a Markdown list format like - $T$: applied tension force, - $f_k$: kinetic friction force, - $m$: mass, and - $a$: acceleration. Do not write malformed inline math like $T$$$, $f_k$$$, $m$$$, or $a$$$. Use single dollar signs for inline math and double dollar signs only for block equations. Do not place punctuation or extra dollar signs immediately after inline math delimiters. Keep equations concise and readable, and do not overuse formulas in non-mathematical explanations."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Uploaded document context:\n"
                        f"{context}\n\n"
                        "Recent conversation:\n"
                        f"{formatted_chat_history}\n\n"
                        "Answer style:\n"
                        f"{answer_mode_instruction}\n\n"
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

