"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

type UploadResult = {
  filename: string;
  num_pages: number;
  text_preview: string;
};

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a PDF file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsUploading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Upload failed. Please try again.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          Back home
        </Link>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Upload a course PDF
          </h1>
          <p className="mt-3 text-slate-700">
            Select one PDF file to extract a plain text preview from the backend.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">PDF file</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 file:mr-4 file:rounded-md file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100"
              />
            </label>

            {selectedFile ? (
              <p className="text-sm text-slate-700">
                Selected file:{" "}
                <span className="font-semibold text-slate-950">{selectedFile.name}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">No file selected yet.</p>
            )}

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="inline-flex items-center rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          {error ? (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {result ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Extracted text preview</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-900">Filename</dt>
                <dd className="mt-1 text-slate-700">{result.filename}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Pages</dt>
                <dd className="mt-1 text-slate-700">{result.num_pages}</dd>
              </div>
            </dl>
            <pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
              {result.text_preview || "No extractable text found in this PDF."}
            </pre>
          </div>
        ) : null}
      </section>
    </main>
  );
}
