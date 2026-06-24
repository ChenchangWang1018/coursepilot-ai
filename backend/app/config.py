import logging
import os
from pathlib import Path

from dotenv import load_dotenv

DEFAULT_OPENAI_MODEL = "gpt-5.5"

logger = logging.getLogger("uvicorn.error")

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)
logger.info(
    "CONFIG_LOADED env_path=%s openai_api_key_loaded=%s",
    ENV_PATH,
    bool(os.getenv("OPENAI_API_KEY")),
)


def get_openai_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

    return api_key


def get_openai_model() -> str:
    return os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
