from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

from .retrieval import DocumentChunk


@dataclass(frozen=True)
class StoredDocument:
    document_id: str
    filename: str
    num_pages: int
    text: str
    chunks: list[DocumentChunk]
    created_at: str
    metadata: dict[str, Any]


_documents: dict[str, StoredDocument] = {}
_store_lock = Lock()


def save_document(
    filename: str,
    text: str,
    metadata: dict[str, Any],
    chunks: list[DocumentChunk],
) -> str:
    document_id = uuid4().hex
    created_at = datetime.now(timezone.utc).isoformat()
    num_pages = int(metadata.get("num_pages", 0))
    stored_metadata = {
        **metadata,
        "filename": filename,
        "created_at": created_at,
    }

    with _store_lock:
        _documents[document_id] = StoredDocument(
            document_id=document_id,
            filename=filename,
            num_pages=num_pages,
            text=text,
            chunks=chunks,
            created_at=created_at,
            metadata=stored_metadata,
        )

    return document_id


def get_document(document_id: str) -> StoredDocument | None:
    with _store_lock:
        return _documents.get(document_id)


def delete_document(document_id: str) -> bool:
    with _store_lock:
        return _documents.pop(document_id, None) is not None
