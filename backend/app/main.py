from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pdf import extract_pdf_text
from app.summary import generate_study_summary

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
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str | int | dict[str, str | list[str]]]:
    filename = file.filename or "uploaded.pdf"

    if file.content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()

    try:
        num_pages, full_text = extract_pdf_text(file_bytes)
        summary = generate_study_summary(full_text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {
        "filename": filename,
        "num_pages": num_pages,
        "text_preview": full_text[:2000],
        "summary": summary,
    }
