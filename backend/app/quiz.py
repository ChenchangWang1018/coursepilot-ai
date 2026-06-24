import logging
from typing import Literal

from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field, model_validator

from .config import get_openai_api_key, get_openai_model

MAX_QUIZ_INPUT_CHARS = 12000

logger = logging.getLogger("uvicorn.error")


class QuizOption(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: Literal["A", "B", "C", "D", "True", "False"]
    text: str


class OptionExplanation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    option_label: Literal["A", "B", "C", "D", "True", "False"]
    explanation: str


class QuizItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    question: str
    type: Literal["multiple_choice", "true_false"]
    topic: str
    difficulty: Literal["easy", "medium", "hard"]
    options: list[QuizOption]
    correct_option: Literal["A", "B", "C", "D", "True", "False"]
    correct_answer: str
    short_explanation: str
    detailed_explanation: str
    why_others_are_wrong: list[OptionExplanation]

    @model_validator(mode="after")
    def validate_options(self) -> "QuizItem":
        labels = [option.label for option in self.options or []]

        if self.type == "multiple_choice":
            if labels != ["A", "B", "C", "D"]:
                raise ValueError("Multiple-choice questions must use A, B, C, D labels.")
            if self.correct_option not in {"A", "B", "C", "D"}:
                raise ValueError("Multiple-choice correct_option must be A, B, C, or D.")
            wrong_labels = {label for label in labels if label != self.correct_option}
            explained_labels = {
                item.option_label for item in self.why_others_are_wrong
            }
            if explained_labels != wrong_labels:
                raise ValueError("Multiple-choice questions must explain every wrong option.")

        if self.type == "true_false":
            if labels != ["True", "False"]:
                raise ValueError('True/false questions must use labels ["True", "False"].')
            if self.correct_option not in {"True", "False"}:
                raise ValueError('True/false correct_option must be "True" or "False".')
            wrong_labels = {label for label in labels if label != self.correct_option}
            explained_labels = {
                item.option_label for item in self.why_others_are_wrong
            }
            if explained_labels != wrong_labels:
                raise ValueError("True/false questions must explain the incorrect option.")

        return self


class QuizResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    questions: list[QuizItem] = Field(min_length=5, max_length=5)

    @model_validator(mode="after")
    def validate_unique_questions(self) -> "QuizResponse":
        ids = [question.id for question in self.questions]
        if sorted(ids) != [1, 2, 3, 4, 5]:
            raise ValueError("Quiz question ids must be exactly 1 through 5.")

        normalized_questions = [
            " ".join(question.question.lower().split()) for question in self.questions
        ]
        if len(set(normalized_questions)) != len(normalized_questions):
            raise ValueError("Quiz questions must not be duplicates.")

        return self


def generate_quiz(text: str) -> list[dict]:
    if not text.strip():
        raise ValueError("No extractable text was found in this PDF.")

    quiz_input = text[:MAX_QUIZ_INPUT_CHARS]
    client = OpenAI(api_key=get_openai_api_key())

    try:
        response = client.responses.create(
            model=get_openai_model(),
            input=[
                {
                    "role": "system",
                    "content": (
                        "You create practice quizzes for students. Use only the uploaded "
                        "course material. Return exactly 5 non-duplicate questions in the "
                        "requested structured JSON. Avoid superficial questions that only "
                        "ask what the PDF says or what an exam requested."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create exactly 5 practice quiz questions from this course text. "
                        "Use only multiple_choice and true_false question types. Do not "
                        "create short_answer questions. "
                        "At least 3 questions must test reasoning, application, proof "
                        "strategy, or conceptual understanding. Avoid duplicate questions. "
                        "Every question must be answerable from the uploaded material. "
                        "Multiple-choice questions must have exactly 4 plausible options "
                        'labeled A, B, C, and D using objects like {"label": "A", '
                        '"text": "..."}. correct_option must be A, B, C, or D, and '
                        "why_others_are_wrong must explain every incorrect option. "
                        'True/false questions must use options labeled "True" and "False" '
                        "and why_others_are_wrong must explain the incorrect option.\n\n"
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
        logger.info("RESPONSE_VALIDATION_STARTED response=practice_quiz")
        quiz = QuizResponse.model_validate_json(response.output_text)
        logger.info("RESPONSE_VALIDATION_SUCCEEDED response=practice_quiz")
    except OpenAIError as exc:
        logger.exception(
            "QUIZ_GENERATION_FAILED: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI quiz generation failed.") from exc
    except ValueError as exc:
        logger.exception(
            "RESPONSE_VALIDATION_FAILED response=practice_quiz: %s: %s",
            type(exc).__name__,
            exc,
        )
        raise RuntimeError("OpenAI quiz generation failed.") from exc

    return [question.model_dump() for question in quiz.questions]
