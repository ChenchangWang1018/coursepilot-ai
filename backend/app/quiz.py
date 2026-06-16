import logging
import os
from typing import Literal

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_QUIZ_INPUT_CHARS = 12000
OPENAI_MODEL = "gpt-5.5"

logger = logging.getLogger(__name__)


class QuizItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    question: str
    type: Literal["multiple_choice", "true_false", "short_answer"]
    topic: str
    difficulty: Literal["easy", "medium", "hard"]
    options: list[str] | None
    correct_answer: str
    explanation: str

    @model_validator(mode="after")
    def validate_options(self) -> "QuizItem":
        if self.type == "multiple_choice" and len(self.options or []) != 4:
            raise ValueError("Multiple-choice questions must have exactly 4 options.")

        if self.type == "true_false" and self.options != ["True", "False"]:
            raise ValueError('True/false questions must use options ["True", "False"].')

        if self.type == "short_answer" and self.options is not None:
            raise ValueError("Short-answer questions must use null for options.")

        return self


class QuizResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    questions: list[QuizItem] = Field(min_length=5, max_length=5)


def generate_quiz(text: str) -> list[dict[str, str | int | list[str] | None]]:
    if not text.strip():
        raise ValueError("No extractable text was found in this PDF.")

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    quiz_input = text[:MAX_QUIZ_INPUT_CHARS]
    client = OpenAI(api_key=api_key)

    try:
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", OPENAI_MODEL),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You create practice quizzes for students. Use only the uploaded "
                        "course material. Return exactly 5 non-duplicate questions in the "
                        "requested structured JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create exactly 5 practice quiz questions from this course text. "
                        "Mix question types when appropriate. Multiple-choice questions "
                        "must have exactly 4 options, true/false questions must use "
                        '["True", "False"], and short-answer questions must use null '
                        "for options. Every answer must be supported by the text.\n\n"
                        f"{quiz_input}"
                    ),
                },
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "practice_quiz",
                    "schema": QuizResponse.model_json_schema(),
                    "strict": True,
                }
            },
        )
        quiz = QuizResponse.model_validate_json(response.output_text)
    except OpenAIError as exc:
        logger.exception(
            "OpenAI quiz generation failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI quiz generation failed.") from exc
    except ValueError as exc:
        logger.exception(
            "OpenAI quiz response validation failed: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI quiz generation failed.") from exc

    return [question.model_dump() for question in quiz.questions]
