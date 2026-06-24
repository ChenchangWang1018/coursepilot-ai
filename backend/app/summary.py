import logging

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field, field_validator

from .config import get_openai_api_key, get_openai_model

MAX_SUMMARY_INPUT_CHARS = 12000

logger = logging.getLogger("uvicorn.error")


class KeyTopic(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    summary: str
    details: str

    @field_validator("summary")
    @classmethod
    def summary_is_one_sentence(cls, value: str) -> str:
        sentence_count = sum(value.count(mark) for mark in ".!?")
        if sentence_count > 1:
            raise ValueError("Key topic summary must be one sentence.")
        return value


class StudySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str
    key_topics: list[KeyTopic]
    must_know: list[str] = Field(max_length=6)
    common_mistakes: list[str] = Field(max_length=5)
    suggested_review_order: list[str]

    @field_validator("overview")
    @classmethod
    def overview_has_at_most_three_sentences(cls, value: str) -> str:
        sentence_count = sum(value.count(mark) for mark in ".!?")
        if sentence_count > 3:
            raise ValueError("Overview must be no more than 3 sentences.")
        return value


def generate_study_summary(text: str) -> dict[str, str | list[str]]:
    if not text.strip():
        raise ValueError("No extractable text was found in this PDF.")

    summary_input = text[:MAX_SUMMARY_INPUT_CHARS]
    client = OpenAI(api_key=get_openai_api_key())

    try:
        response = client.responses.create(
            model=get_openai_model(),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You create concise, exam-relevant study summaries for students. "
                        "Prioritize useful concepts, reduce repetition, and return only "
                        "the requested structured JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create a structured study summary from this course text. "
                        "The overview must be no more than 3 sentences. Each key topic "
                        "needs a name, a one-sentence summary, and short practical details. "
                        "Include no more than 6 must-know items, no more than 5 common "
                        "mistakes, and a concise suggested review order. Focus on what is "
                        "most likely useful for exams and avoid repeating the same idea.\n\n"
                        f"{summary_input}"
                    ),
                },
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "study_summary",
                    "schema": StudySummary.model_json_schema(),
                    "strict": True,
                }
            },
        )
        logger.info("RESPONSE_VALIDATION_STARTED response=study_summary")
        summary = StudySummary.model_validate_json(response.output_text)
        logger.info("RESPONSE_VALIDATION_SUCCEEDED response=study_summary")
        return summary.model_dump()
    except OpenAIError as exc:
        logger.exception(
            "SUMMARY_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI summary generation failed.") from exc
    except ValueError as exc:
        logger.exception(
            "RESPONSE_VALIDATION_FAILED response=study_summary: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI summary generation failed.") from exc
