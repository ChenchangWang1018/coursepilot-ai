# CoursePilot AI

CoursePilot AI is a full-stack AI-powered course study assistant that turns course PDFs into study guides, practice quizzes, and source-grounded tutor conversations.

Students can upload a PDF, generate structured study materials, answer quiz questions, review weak topics, and ask follow-up questions through an AI tutor that retrieves relevant document chunks and shows the snippets it used.

## Why I Built This

Course materials often live in long PDFs, lecture notes, and review packets that are hard to turn into an efficient study plan. I built CoursePilot AI to explore how full-stack product design, PDF processing, LLM generation, and retrieval-augmented generation can work together in a practical student workflow.

The project is intentionally scoped as an MVP: useful enough to demonstrate the core experience, but simple enough to keep the architecture readable and extensible.

## Key Features

- PDF upload from the frontend
- PDF text extraction with PyMuPDF
- Processing progress UI while study materials are generated
- AI-generated study guide with overview, key topics, must-know concepts, common mistakes, and review order
- AI-generated practice quiz
- Quiz answering, scoring, and feedback
- Quiz report with weak topics and recommended next steps
- Ask Tutor chat for document-specific questions
- Multi-turn chat context
- Answer style modes: Concise, Step-by-step, and Exam Answer
- Quiz Report to Ask Tutor integration for targeted review
- Markdown and LaTeX math rendering for AI-generated content
- In-memory document store with `document_id`
- Basic RAG with document chunking and keyword retrieval
- Source snippets displayed under tutor answers

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- React Markdown
- KaTeX

### Backend

- FastAPI
- Python
- PyMuPDF
- OpenAI API

### Storage

- In-memory document store for the MVP
- No database or persistence yet

## Architecture Overview

1. The user uploads a course PDF in the Next.js frontend.
2. The FastAPI backend validates the file and extracts text with PyMuPDF.
3. The backend stores the extracted full text in memory with a generated `document_id`.
4. The backend splits the document into readable text chunks.
5. The backend generates a study guide and practice quiz using the OpenAI API.
6. The frontend displays the study guide, quiz, quiz report, and Ask Tutor chat.
7. When the user asks the tutor a question, the backend retrieves the most relevant chunks.
8. The tutor answers using the retrieved chunks as the primary context.
9. The frontend displays the answer, suggested follow-ups, and source snippets used.

## Basic RAG Pipeline

CoursePilot AI currently uses a lightweight MVP retrieval pipeline:

1. **Chunking**: Uploaded document text is split into chunks of roughly 1,200 characters with overlap.
2. **Keyword retrieval**: The tutor question is tokenized, common stop words are ignored, and chunks are scored by keyword overlap.
3. **Top chunks**: The top relevant chunks are passed to the Ask Tutor prompt instead of the full raw document.
4. **Grounded answer**: The tutor is instructed to answer primarily from the retrieved chunks and say when the chunks do not contain enough information.
5. **Source snippets**: Up to three short snippets from retrieved chunks are returned and shown under the tutor answer.

This is not embedding-based retrieval yet. It is designed to be deterministic, simple, and easy to replace with vector search later.

## Screenshots

<img width="2552" height="1274" alt="image" src="https://github.com/user-attachments/assets/1085fd37-64a6-4636-a9f6-c1a4564ec34d" />
<img width="2552" height="1274" alt="image" src="https://github.com/user-attachments/assets/fb89c981-5994-4b52-924c-36c42e33e757" />
<img width="2552" height="1274" alt="image" src="https://github.com/user-attachments/assets/b29dc3f7-d48f-4847-8ecc-ca3b9de96691" />
<img width="2552" height="1274" alt="image" src="https://github.com/user-attachments/assets/06db44da-a3cc-4f27-9d94-53e0ca12e512" />

## Local Development Setup

Clone the repository and install dependencies for both the frontend and backend.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

### Backend

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

macOS/Linux:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=your_key_here
```

Do not commit `.env` files or API keys. Keep secrets local.

## How To Use The App

1. Start the backend server.
2. Start the frontend dev server.
3. Open `http://localhost:3000`.
4. Upload a course PDF.
5. Wait for processing to finish.
6. Review the generated Study Guide.
7. Answer Practice Quiz questions and submit answers.
8. Review the Quiz Report for weak topics and recommendations.
9. Use Ask Tutor to ask document-specific questions.
10. Review the source snippets shown under tutor answers.

## Current Limitations

- The document store is in memory and resets when the backend restarts.
- Retrieval is keyword-based, not embedding-based.
- Source snippets do not include page numbers yet.
- There are no user accounts or persistent document history.
- There is no deployed production version yet.
- The MVP does not support OCR for scanned PDFs.
- The quality of summaries, quizzes, and tutor answers depends on extracted PDF text quality.

## Future Improvements

- Embedding-based RAG
- Supabase PostgreSQL with pgvector
- User accounts and authentication
- Persistent document history
- Source citations with page numbers
- Deployment
- Evaluation pipeline for summaries, quizzes, and retrieval quality
- Better document parsing for complex PDFs
- OCR support for scanned documents

## Resume Bullet Examples

- Built a full-stack AI study assistant with Next.js, FastAPI, TypeScript, Python, and OpenAI API integration.
- Implemented PDF upload and text extraction with PyMuPDF, enabling automated study guide and quiz generation from course documents.
- Designed an MVP RAG pipeline using document chunking, keyword retrieval, and source snippets for transparent tutor answers.
- Developed an interactive quiz workflow with scoring, answer explanations, weak topic analysis, and targeted tutor follow-ups.
- Added Markdown and LaTeX rendering for AI-generated educational content, including formulas in study guides, quizzes, and tutor responses.

## License

This project is currently for personal portfolio and learning purposes.
