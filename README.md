# CoursePilot AI

CoursePilot AI is a full-stack AI-powered course study assistant designed to help students turn course materials into structured study resources.

The MVP allows users to upload course PDFs, extract text, generate study summaries, identify key topics, and create quiz questions for review.

## Project Goal

Many students study from lecture notes, practice exams, homework files, and scattered PDFs. CoursePilot AI aims to make that process more efficient by converting course materials into:

* Structured summaries
* Important concepts and definitions
* Topic lists
* Practice quiz questions
* Personalized review suggestions

## MVP Features

The first version will include:

* PDF upload
* PDF text extraction
* AI-generated study summary
* AI-generated topic list
* AI-generated quiz questions
* Clean frontend result display

## Planned Future Features

After the MVP is complete, future improvements may include:

* RAG-based course Q&A
* Source-grounded answers with citations
* User study history
* Weak topic analysis
* Personalized review plans
* Course dashboard
* Supabase PostgreSQL integration
* Vector search with pgvector

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* FastAPI
* Python
* PyMuPDF
* OpenAI API

### Database

* No database in MVP
* Future plan: Supabase PostgreSQL and pgvector

## Project Structure

coursepilot-ai/
  frontend/
  backend/
  README.md
  AGENTS.md


## Current Status

This project is currently in early MVP development.

Initial development focus:

1. Set up frontend and backend structure
2. Build PDF upload page
3. Implement PDF text extraction API
4. Add AI summary generation
5. Add quiz generation
6. Display results in the frontend

## Environment Variables

The backend will require the following environment variable once AI features are added:

OPENAI_API_KEY=your_api_key_here

API keys should never be committed to GitHub.

## Local Development

Setup instructions will be added as the frontend and backend are implemented.

## License

This project is currently for personal portfolio and learning purposes.
