import re
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

TARGET_CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
MAX_RETRIEVED_CHUNKS = 4

STOP_WORDS = {
    "about",
    "after",
    "again",
    "also",
    "and",
    "are",
    "because",
    "been",
    "before",
    "being",
    "between",
    "both",
    "can",
    "could",
    "did",
    "does",
    "define",
    "for",
    "from",
    "explain",
    "had",
    "has",
    "have",
    "how",
    "include",
    "into",
    "its",
    "just",
    "more",
    "most",
    "not",
    "out",
    "over",
    "should",
    "show",
    "than",
    "that",
    "the",
    "their",
    "then",
    "there",
    "these",
    "they",
    "this",
    "through",
    "using",
    "was",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "why",
    "with",
    "would",
    "you",
    "your",
}


@dataclass(frozen=True)
class DocumentChunk:
    chunk_id: str
    index: int
    text: str
    metadata: dict[str, Any] = field(default_factory=dict)


def _clean_chunk_text(text: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def _split_long_text(text: str, start_index: int) -> list[tuple[int, int, str]]:
    chunks: list[tuple[int, int, str]] = []
    text_length = len(text)
    start = 0

    while start < text_length:
        target_end = min(start + TARGET_CHUNK_SIZE, text_length)
        end = target_end

        if target_end < text_length:
            boundary = max(
                text.rfind("\n", start, target_end),
                text.rfind(". ", start, target_end),
                text.rfind("? ", start, target_end),
                text.rfind("! ", start, target_end),
                text.rfind(" ", start, target_end),
            )
            if boundary > start + TARGET_CHUNK_SIZE // 2:
                end = boundary + 1

        chunk_text = _clean_chunk_text(text[start:end])
        if chunk_text:
            chunks.append((start_index + start, start_index + end, chunk_text))

        if end >= text_length:
            break

        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


def create_document_chunks(text: str) -> list[DocumentChunk]:
    normalized_text = text.replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [
        match
        for match in re.finditer(r"\S[\s\S]*?(?=\n\s*\n|\Z)", normalized_text)
        if match.group(0).strip()
    ]
    raw_chunks: list[tuple[int, int, str]] = []
    current_parts: list[str] = []
    current_start: int | None = None
    current_end = 0

    for paragraph_match in paragraphs:
        paragraph = paragraph_match.group(0).strip()
        paragraph_start = paragraph_match.start()
        paragraph_end = paragraph_match.end()

        if len(paragraph) > TARGET_CHUNK_SIZE:
            if current_parts:
                raw_chunks.append(
                    (current_start or 0, current_end, _clean_chunk_text("\n\n".join(current_parts)))
                )
                current_parts = []
                current_start = None

            raw_chunks.extend(_split_long_text(paragraph, paragraph_start))
            current_end = paragraph_end
            continue

        candidate = "\n\n".join([*current_parts, paragraph])
        if current_parts and len(candidate) > TARGET_CHUNK_SIZE:
            raw_chunks.append(
                (current_start or 0, current_end, _clean_chunk_text("\n\n".join(current_parts)))
            )

            overlap_text = current_parts[-1] if len(current_parts[-1]) <= CHUNK_OVERLAP else ""
            current_parts = [overlap_text, paragraph] if overlap_text else [paragraph]
            current_start = paragraph_start - len(overlap_text) if overlap_text else paragraph_start
        else:
            if current_start is None:
                current_start = paragraph_start
            current_parts.append(paragraph)

        current_end = paragraph_end

    if current_parts:
        raw_chunks.append(
            (current_start or 0, current_end, _clean_chunk_text("\n\n".join(current_parts)))
        )

    return [
        DocumentChunk(
            chunk_id=f"chunk-{index}",
            index=index,
            text=chunk_text,
            metadata={"char_start": start, "char_end": end},
        )
        for index, (start, end, chunk_text) in enumerate(raw_chunks)
        if chunk_text
    ]


def _tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-zA-Z][a-zA-Z0-9_]{2,}", text.lower())
        if token not in STOP_WORDS
    ]


def retrieve_relevant_chunks(
    question: str,
    chunks: list[DocumentChunk],
    limit: int = MAX_RETRIEVED_CHUNKS,
) -> list[DocumentChunk]:
    if not chunks:
        return []

    question_tokens = _tokenize(question)
    if not question_tokens:
        return chunks[:limit]

    question_counts = Counter(question_tokens)
    scored_chunks: list[tuple[float, int, DocumentChunk]] = []

    for chunk in chunks:
        chunk_tokens = _tokenize(chunk.text)
        if not chunk_tokens:
            continue

        chunk_counts = Counter(chunk_tokens)
        overlap = set(question_counts) & set(chunk_counts)
        score = sum(question_counts[token] * chunk_counts[token] for token in overlap)
        score += len(overlap) * 1.5

        if score > 0:
            scored_chunks.append((score, chunk.index, chunk))

    if not scored_chunks:
        return chunks[:limit]

    scored_chunks.sort(key=lambda item: (-item[0], item[1]))
    return [chunk for _score, _index, chunk in scored_chunks[:limit]]


def format_chunks_for_context(chunks: list[DocumentChunk]) -> str:
    return "\n\n".join(
        f"[Chunk {chunk.index}]\n{chunk.text.strip()}" for chunk in chunks if chunk.text.strip()
    )
