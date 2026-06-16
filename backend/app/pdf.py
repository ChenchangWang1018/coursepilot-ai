import fitz


def extract_pdf_text(file_bytes: bytes) -> tuple[int, str]:
    if not file_bytes:
        raise ValueError("The uploaded PDF is empty.")

    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as document:
            page_text = [page.get_text() for page in document]
            return document.page_count, "\n".join(page_text).strip()
    except (fitz.FileDataError, ValueError, RuntimeError) as exc:
        raise ValueError("The uploaded PDF could not be read.") from exc
