# CoursePilot AI - Agent Instructions

You are helping me build CoursePilot AI, a full-stack AI-powered course study assistant.

## Product Goal

Build a web app that allows students to upload course PDFs, extract text, generate structured summaries, identify key topics, generate quizzes, and eventually provide RAG-based course Q&A.

## Tech Stack

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- Python
- PyMuPDF for PDF text extraction
- OpenAI API for summary and quiz generation

Database:
- No database in MVP.
- Later: Supabase PostgreSQL and pgvector.

## MVP Scope

The MVP should support:
1. Upload a PDF from the frontend.
2. Send it to the FastAPI backend.
3. Extract text from the PDF.
4. Generate a structured summary.
5. Generate 5 quiz questions.
6. Return the summary and quiz to the frontend.
7. Display the result cleanly.

## Not in MVP

Do not implement:
- Authentication
- User accounts
- Payments
- OCR
- Complex dashboard
- Mobile app
- Discord bot
- Vector database
- RAG until MVP is complete

## Coding Rules

- Keep code simple and readable.
- Prefer small components and small functions.
- Do not over-engineer.
- Do not change unrelated files.
- Do not add dependencies unless they are necessary.
- If a dependency is needed, explain why.
- After changes, explain what files changed and how to run or test them.
- Use environment variables for API keys.
- Never hardcode secrets.