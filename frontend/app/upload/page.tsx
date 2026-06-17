"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

type UploadResult = {
  filename: string;
  num_pages: number;
  text_preview: string;
  summary: StudySummary;
  quiz: QuizItem[];
};

type StudySummary = {
  overview: string;
  key_topics: KeyTopic[];
  must_know: string[];
  common_mistakes: string[];
  suggested_review_order: string[];
};

type KeyTopic = {
  name: string;
  summary: string;
  details: string;
};

type QuizOption = {
  label: "A" | "B" | "C" | "D" | "True" | "False";
  text: string;
};

type OptionExplanation = {
  option_label: "A" | "B" | "C" | "D" | "True" | "False";
  explanation: string;
};

type OptionLabel = "A" | "B" | "C" | "D" | "True" | "False";

type QuizItem = {
  id: number;
  question: string;
  type: "multiple_choice" | "true_false";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  options: QuizOption[];
  correct_option: OptionLabel;
  correct_answer: string;
  short_explanation: string;
  detailed_explanation: string;
  why_others_are_wrong: OptionExplanation[];
};

type SummaryListProps = {
  title: string;
  items: string[];
  ordered?: boolean;
};

function SummaryList({ title, items, ordered = false }: SummaryListProps) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <section>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {items.length > 0 ? (
        <ListTag className="mt-3 space-y-2 text-slate-700">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-md bg-slate-50 px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ListTag>
      ) : (
        <p className="mt-3 text-slate-500">No items returned.</p>
      )}
    </section>
  );
}

function formatLabel(value: string) {
  return value.replace("_", " ");
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, OptionLabel>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, OptionLabel>>({});
  const [openTopicDetails, setOpenTopicDetails] = useState<string[]>([]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setError("");
    resetQuiz();
    setOpenTopicDetails([]);
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
    resetQuiz();
    setOpenTopicDetails([]);

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

  function toggleTopicDetails(topicName: string) {
    setOpenTopicDetails((current) =>
      current.includes(topicName)
        ? current.filter((name) => name !== topicName)
        : [...current, topicName],
    );
  }

  function selectOption(questionId: number, optionLabel: OptionLabel) {
    if (submittedAnswers[questionId]) {
      return;
    }

    setSelectedOptions((current) => ({
      ...current,
      [questionId]: optionLabel,
    }));
  }

  function submitAnswer(questionId: number) {
    const selectedOption = selectedOptions[questionId];
    if (!selectedOption || submittedAnswers[questionId]) {
      return;
    }

    setSubmittedAnswers((current) => ({
      ...current,
      [questionId]: selectedOption,
    }));
  }

  function resetQuiz() {
    setSelectedOptions({});
    setSubmittedAnswers({});
  }

  const score = result
    ? result.quiz.filter((item) => submittedAnswers[item.id] === item.correct_option).length
    : 0;

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

        {result ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">Study summary</h2>
            <section className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Overview
              </h3>
              <p className="mt-2 leading-7 text-slate-700">{result.summary.overview}</p>
            </section>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <SummaryList title="Must know" items={result.summary.must_know} />
              <SummaryList
                title="Review order"
                items={result.summary.suggested_review_order}
                ordered
              />
            </div>

            <div className="mt-6 grid gap-5">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Key topics
                </h3>
                <div className="mt-3 space-y-2">
                  {result.summary.key_topics.map((topic) => (
                    <article key={topic.name} className="rounded-md bg-slate-50 px-3 py-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-950">{topic.name}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {topic.summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleTopicDetails(topic.name)}
                          className="shrink-0 self-start rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                        >
                          {openTopicDetails.includes(topic.name)
                            ? "Hide details"
                            : "Show details"}
                        </button>
                      </div>
                      {openTopicDetails.includes(topic.name) ? (
                        <p className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-600">
                          {topic.details}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
              <SummaryList title="Common mistakes" items={result.summary.common_mistakes} />
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-950">Practice quiz</h2>
              <div className="flex items-center gap-3">
                <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
                  Score: {score} / {result.quiz.length}
                </p>
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
                >
                  Reset quiz
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {result.quiz.map((item, index) => {
                const selectedOption = selectedOptions[item.id];
                const submittedOption = submittedAnswers[item.id];
                const isSubmitted = Boolean(submittedOption);
                const isCorrect = submittedOption === item.correct_option;

                return (
                  <article
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        {formatLabel(item.type)}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        {item.topic}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        {item.difficulty}
                      </span>
                    </div>

                    <h3 className="mt-4 font-semibold leading-7 text-slate-950">
                      {index + 1}. {item.question}
                    </h3>

                    <fieldset className="mt-4 grid gap-2 text-slate-700 sm:grid-cols-2">
                      <legend className="sr-only">Choose one answer</legend>
                      {item.options.map((option) => (
                        <label
                          key={option.label}
                          className={[
                            "flex cursor-pointer gap-3 rounded-md border px-3 py-2 transition",
                            selectedOption === option.label
                              ? "border-teal-600 bg-teal-50"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                            isSubmitted ? "cursor-not-allowed hover:bg-white" : "",
                            isSubmitted && option.label === item.correct_option
                              ? "border-green-500 bg-green-50"
                              : "",
                            isSubmitted &&
                            option.label === submittedOption &&
                            option.label !== item.correct_option
                              ? "border-red-400 bg-red-50"
                              : "",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name={`question-${item.id}`}
                            value={option.label}
                            checked={selectedOption === option.label}
                            disabled={isSubmitted}
                            onChange={() => selectOption(item.id, option.label)}
                            className="sr-only"
                          />
                          <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-teal-50 text-sm font-bold text-teal-800">
                            {option.label}
                          </span>{" "}
                          <span className="pt-1 text-sm leading-5">{option.text}</span>
                        </label>
                      ))}
                    </fieldset>

                    <button
                      type="button"
                      onClick={() => submitAnswer(item.id)}
                      disabled={!selectedOption || isSubmitted}
                      className="mt-5 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {isSubmitted ? "Submitted" : "Submit answer"}
                    </button>

                    {isSubmitted ? (
                      <div className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-slate-700">
                        <p
                          className={
                            isCorrect
                              ? "font-semibold text-green-700"
                              : "font-semibold text-red-700"
                          }
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-slate-950">
                            Selected option:
                          </span>{" "}
                          {submittedOption}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            Correct option:
                          </span>{" "}
                          {item.correct_option}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-slate-950">
                            Full correct answer:
                          </span>{" "}
                          {item.correct_answer}
                        </p>
                        <p className="mt-2">
                          <span className="font-semibold text-slate-950">
                            Short explanation:
                          </span>{" "}
                          {item.short_explanation}
                        </p>
                        <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                          <summary className="cursor-pointer font-semibold text-slate-950">
                            Detailed explanation
                          </summary>
                          <p className="mt-2 text-slate-700">{item.detailed_explanation}</p>
                        </details>
                        {item.why_others_are_wrong.length > 0 ? (
                          <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <summary className="cursor-pointer font-semibold text-slate-950">
                              Why other options are wrong:
                            </summary>
                            <ul className="mt-2 space-y-2">
                              {item.why_others_are_wrong.map((wrongOption) => (
                                <li key={wrongOption.option_label}>
                                  <span className="font-semibold text-slate-950">
                                    {wrongOption.option_label}:
                                  </span>{" "}
                                  {wrongOption.explanation}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
