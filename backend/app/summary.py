import logging
import os

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict

MAX_SUMMARY_INPUT_CHARS = 12000
OPENAI_MODEL = "gpt-5.5"

logger = logging.getLogger(__name__)


class StudySummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overview: str
    main_topics: list[str]
    important_concepts: list[str]
    formulas_or_definitions: list[str]
    suggested_review_order: list[str]


def generate_study_summary(text: str) -> dict[str, str | list[str]]:
    if not text.strip():
        raise ValueError("No extractable text was found in this PDF.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    summary_input = text[:MAX_SUMMARY_INPUT_CHARS]
    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", OPENAI_MODEL),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You create concise, useful study summaries for students. "
                        "Return only the requested structured JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create a structured study summary from this course text. "
                        "Focus on what a student should understand and review.\n\n"
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
    except OpenAIError as exc:
        logger.exception(
            "OpenAI summary generation failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI summary generation failed.") from exc

    return StudySummary.model_validate_json(response.output_text).model_dump()
