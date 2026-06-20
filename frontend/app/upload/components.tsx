import { ChangeEvent, FormEvent, useState } from "react";
import {
  OptionLabel,
  ProcessingStage,
  QuizItem,
  ResultTab,
  StudySummary,
  UploadResult,
} from "./types";
import { PerformanceBucket, QuizAnalysis } from "./quizAnalysis";

type UploadFormProps = {
  selectedFile: File | null;
  error: string;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function UploadForm({
  selectedFile,
  error,
  onFileChange,
  onSubmit,
}: UploadFormProps) {
  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        Upload a course PDF
      </h1>
      <p className="mt-3 text-slate-700">
        Select one PDF file to generate a study guide and practice quiz.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">PDF file</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onFileChange}
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
          disabled={!selectedFile}
          className="inline-flex items-center rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Upload
        </button>
      </form>

      {error ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

type ProcessingProgressProps = {
  filename: string;
  progress: number;
  stage: ProcessingStage;
  status: "processing" | "success" | "error";
  error: string;
  onTryAgain: () => void;
};

export function ProcessingProgress({
  filename,
  progress,
  stage,
  status,
  error,
  onTryAgain,
}: ProcessingProgressProps) {
  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
        {status === "error" ? "Processing failed" : "Processing"}
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {filename}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Processing may take a moment while CoursePilot reads the PDF and prepares your
        study materials.
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-800">
            {status === "success" ? "Complete" : stage}
          </span>
          <span className="font-semibold text-slate-600">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              status === "error" ? "bg-red-500" : "bg-teal-700",
            ].join(" ")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {status === "success" ? (
        <p className="mt-5 rounded-md bg-green-50 p-4 text-sm font-semibold text-green-700">
          Processing complete. Your study guide and practice quiz are ready.
        </p>
      ) : null}

      {status === "error" ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">
            {error || "We couldn't process this PDF. Please try again."}
          </p>
          <button
            type="button"
            onClick={onTryAgain}
            className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

type ResultHeaderProps = {
  result: UploadResult;
  onUploadAnother: () => void;
};

export function ResultHeader({ result, onUploadAnother }: ResultHeaderProps) {
  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-700">Successfully processed</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{result.filename}</h1>
          <p className="mt-1 text-sm text-slate-600">{result.num_pages} pages</p>
        </div>
        <button
          type="button"
          onClick={onUploadAnother}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
        >
          Upload another PDF
        </button>
      </div>
    </div>
  );
}

type ResultTabsProps = {
  activeTab: ResultTab;
  onTabChange: (tab: ResultTab) => void;
};

export function ResultTabs({ activeTab, onTabChange }: ResultTabsProps) {
  const tabs: Array<{ id: ResultTab; label: string }> = [
    { id: "study", label: "Study Guide" },
    { id: "quiz", label: "Practice Quiz" },
  ];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              "rounded-md px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2",
              activeTab === tab.id
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
            <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
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

type StudyGuideProps = {
  summary: StudySummary;
};

export function StudyGuide({ summary }: StudyGuideProps) {
  const [openTopicDetails, setOpenTopicDetails] = useState<string[]>([]);

  function toggleTopicDetails(topicName: string) {
    setOpenTopicDetails((current) =>
      current.includes(topicName)
        ? current.filter((name) => name !== topicName)
        : [...current, topicName],
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">Study guide</h2>
      <section className="mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Overview
        </h3>
        <p className="mt-2 leading-7 text-slate-700">{summary.overview}</p>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <SummaryList title="Must know" items={summary.must_know} />
        <SummaryList title="Review order" items={summary.suggested_review_order} ordered />
      </div>

      <div className="mt-6 grid gap-5">
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Key topics
          </h3>
          <div className="mt-3 space-y-2">
            {summary.key_topics.map((topic) => (
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
                    {openTopicDetails.includes(topic.name) ? "Hide details" : "Show details"}
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
        <SummaryList title="Common mistakes" items={summary.common_mistakes} />
      </div>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace("_", " ");
}

type PracticeQuizProps = {
  quiz: QuizItem[];
  selectedOptions: Record<number, OptionLabel>;
  submittedAnswers: Record<number, OptionLabel>;
  analysis: QuizAnalysis;
  score: number;
  onSelectOption: (questionId: number, optionLabel: OptionLabel) => void;
  onSubmitAnswer: (questionId: number) => void;
  onResetQuiz: () => void;
};

function displayTopic(topic: string | undefined) {
  const normalizedTopic = topic?.trim();
  return normalizedTopic || "Untitled topic";
}

function displayDifficulty(difficulty: string | undefined) {
  return difficulty || "unknown";
}

export function PracticeQuiz({
  quiz,
  selectedOptions,
  submittedAnswers,
  analysis,
  score,
  onSelectOption,
  onSubmitAnswer,
  onResetQuiz,
}: PracticeQuizProps) {
  const isReportUnlocked = analysis.totalSubmitted === quiz.length;

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-950">Practice quiz</h2>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex items-center gap-3">
            <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
              Score: {score} / {quiz.length}
            </p>
            <button
              type="button"
              onClick={onResetQuiz}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2"
            >
              Reset quiz
            </button>
          </div>
          {!isReportUnlocked ? (
            <p className="text-sm text-slate-600">
              Complete all {quiz.length} questions to unlock your quiz report.{" "}
              {analysis.totalSubmitted} / {quiz.length} questions completed.
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {quiz.map((item, index) => {
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
                  {displayTopic(item.topic)}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                  {displayDifficulty(item.difficulty)}
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
                      onChange={() => onSelectOption(item.id, option.label)}
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
                onClick={() => onSubmitAnswer(item.id)}
                disabled={!selectedOption || isSubmitted}
                className="mt-5 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isSubmitted ? "Submitted" : "Submit answer"}
              </button>

              {isSubmitted ? (
                <div className="mt-4 rounded-md bg-white p-4 text-sm leading-6 text-slate-700">
                  <p
                    className={
                      isCorrect ? "font-semibold text-green-700" : "font-semibold text-red-700"
                    }
                  >
                    {isCorrect ? "Correct" : "Incorrect"}
                  </p>
                  <p className="mt-2">
                    <span className="font-semibold text-slate-950">Selected option:</span>{" "}
                    {submittedOption}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Correct option:</span>{" "}
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
      <QuizReview analysis={analysis} totalQuestions={quiz.length} />
    </div>
  );
}

type MiniStatProps = {
  label: string;
  value: string;
};

function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-950">{value}</p>
    </div>
  );
}

type PerformanceListProps = {
  buckets: PerformanceBucket[];
  emptyMessage: string;
};

function PerformanceList({ buckets, emptyMessage }: PerformanceListProps) {
  if (buckets.length === 0) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {buckets.map((bucket) => (
        <div
          key={bucket.name}
          className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
        >
          <span className="font-semibold capitalize text-slate-800">{bucket.name}</span>
          <span className="text-slate-600">
            {bucket.correct} / {bucket.submitted} - {bucket.accuracy}%
          </span>
        </div>
      ))}
    </div>
  );
}

type QuizReviewProps = {
  analysis: QuizAnalysis;
  totalQuestions: number;
};

function getReportStatus(accuracy: number) {
  if (accuracy >= 80) {
    return {
      label: "Strong",
      subtitle: "Strong performance. You are ready for harder practice.",
      className: "bg-green-50 text-green-700 ring-green-200",
    };
  }

  if (accuracy >= 60) {
    return {
      label: "Good",
      subtitle: "Good start. Review a few weak spots.",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  return {
    label: "Needs Review",
    subtitle: "Needs review. Focus on the topics below.",
    className: "bg-red-50 text-red-700 ring-red-200",
  };
}

function QuizReview({ analysis, totalQuestions }: QuizReviewProps) {
  if (analysis.totalSubmitted < totalQuestions) {
    return null;
  }

  const reportStatus = getReportStatus(analysis.overallAccuracy);
  const weakTopics = analysis.weakTopics.slice(0, 3);
  const recommendations = analysis.recommendedNextSteps.slice(0, 4);

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Quiz Report</h2>
          <p className="mt-1 text-sm text-slate-600">{reportStatus.subtitle}</p>
        </div>
        <span
          className={[
            "inline-flex self-start rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset",
            reportStatus.className,
          ].join(" ")}
        >
          {reportStatus.label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat
          label="Score"
          value={`${analysis.totalCorrect} / ${totalQuestions}`}
        />
        <MiniStat label="Accuracy" value={`${analysis.overallAccuracy}%`} />
        <MiniStat label="Result" value={reportStatus.label} />
      </div>

      <section className="mt-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Main weak areas
        </h3>
        {weakTopics.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {weakTopics.map((topic) => (
              <div
                key={topic.name}
                className="rounded-md border border-red-100 bg-red-50 px-3 py-3 text-sm"
              >
                <p className="font-semibold text-red-800">{topic.name}</p>
                <p className="mt-1 text-red-700">
                  {topic.correct} / {topic.submitted} correct
                </p>
                <p className="text-red-700">{topic.accuracy}% accuracy</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            No major weak topics identified.
          </p>
        )}
      </section>

      <section className="mt-5 rounded-md border border-teal-100 bg-teal-50 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
          Recommended next steps
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-teal-900">
          {recommendations.map((step) => (
            <li key={step} className="rounded-md bg-white/70 px-3 py-2">
              {step}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Missed questions
        </h3>
        {analysis.missedQuestions.length > 0 ? (
          <div className="space-y-2">
            {analysis.missedQuestions.map((question) => (
              <article
                key={question.id}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
              >
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Question {question.id}</span>
                  <span>{question.topic}</span>
                  <span>{question.difficulty}</span>
                </div>
                <p className="mt-2 font-semibold text-slate-950">
                  {question.question.length > 120
                    ? `${question.question.slice(0, 120)}...`
                    : question.question}
                </p>
                <p className="mt-2 text-slate-700">
                  <span className="font-semibold">Correct option:</span>{" "}
                  {question.correctOption}
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold">Correct answer:</span>{" "}
                  {question.correctAnswer}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            No missed submitted questions yet.
          </p>
        )}
      </section>

      <div className="mt-5 grid gap-3">
        <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            Topic breakdown
          </summary>
          <div className="mt-3">
            <PerformanceList
              buckets={analysis.performanceByTopic}
              emptyMessage="No topic performance available."
            />
          </div>
        </details>

        <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            Difficulty breakdown
          </summary>
          <div className="mt-3">
            <PerformanceList
              buckets={analysis.performanceByDifficulty}
              emptyMessage="No difficulty performance available."
            />
          </div>
        </details>
      </div>
    </section>
  );
}
