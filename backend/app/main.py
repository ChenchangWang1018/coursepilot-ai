import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CoursePilot AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str | int]:
    filename = file.filename or "uploaded.pdf"

    if file.content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as document:
            page_text = [page.get_text() for page in document]
            full_text = "\n".join(page_text).strip()

            return {
                "filename": filename,
                "num_pages": document.page_count,
                "text_preview": full_text[:2000],
            }
    except (fitz.FileDataError, ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF could not be read.",
        ) from exc
