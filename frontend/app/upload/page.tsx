"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  AskTutor,
  PracticeQuiz,
  ProcessingProgress,
  ResultHeader,
  ResultTabs,
  StudyGuide,
  UploadForm,
} from "./components";
import { analyzeQuizPerformance } from "./quizAnalysis";
import {
  ChatMessage,
  OptionLabel,
  ProcessingStage,
  ResultTab,
  UploadResult,
} from "./types";

const PROCESSING_STAGES: ProcessingStage[] = [
  "Uploading PDF",
  "Extracting document text",
  "Generating study guide",
  "Creating practice quiz",
];

function getProcessingStage(progress: number): ProcessingStage {
  if (progress < 30) {
    return "Uploading PDF";
  }

  if (progress < 55) {
    return "Extracting document text";
  }

  if (progress < 75) {
    return "Generating study guide";
  }

  return "Creating practice quiz";
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [pendingResult, setPendingResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(10);
  const [activeTab, setActiveTab] = useState<ResultTab>("study");
  const [selectedOptions, setSelectedOptions] = useState<Record<number, OptionLabel>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, OptionLabel>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const progressTimerRef = useRef<number | null>(null);
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clearProgressTimers();
    };
  }, []);

  function clearProgressTimers() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }

  function resetQuiz() {
    setSelectedOptions({});
    setSubmittedAnswers({});
  }

  function resetTutor() {
    setChatMessages([]);
    setChatInput("");
    setChatError("");
    setIsTutorLoading(false);
  }

  function resetForNewUpload() {
    clearProgressTimers();
    setSelectedFile(null);
    setResult(null);
    setPendingResult(null);
    setError("");
    setProcessingStatus("idle");
    setProgress(10);
    setActiveTab("study");
    resetQuiz();
    resetTutor();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setPendingResult(null);
    setError("");
    setProcessingStatus("idle");
    setProgress(10);
    setActiveTab("study");
    resetQuiz();
    resetTutor();
  }

  function startSimulatedProgress() {
    clearProgressTimers();
    setProgress(10);
    setProcessingStatus("processing");

    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return 90;
        }

        const nextProgress = current + Math.max(1, Math.round((90 - current) / 12));
        return Math.min(nextProgress, 90);
      });
    }, 650);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile || processingStatus === "processing") {
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setError("");
    setResult(null);
    setPendingResult(null);
    setActiveTab("study");
    resetQuiz();
    resetTutor();
    startSimulatedProgress();

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      const data = await response.json();
      clearProgressTimers();
      setPendingResult(data);
      setProgress(100);
      setProcessingStatus("success");

      successTimerRef.current = window.setTimeout(() => {
        setResult(data);
        setPendingResult(null);
        setProcessingStatus("idle");
        successTimerRef.current = null;
      }, 900);
    } catch {
      clearProgressTimers();
      setPendingResult(null);
      setProcessingStatus("error");
      setError("We couldn't process this PDF. Please try again.");
    }
  }

  function handleTryAgain() {
    clearProgressTimers();
    setError("");
    setProcessingStatus("idle");
    setProgress(10);
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

  async function askTutor(questionOverride?: string) {
    const question = (questionOverride ?? chatInput).trim();

    if (!question || isTutorLoading) {
      return;
    }

    if (!result?.document_id) {
      setChatError("Ask Tutor is unavailable for this upload. Please upload the PDF again.");
      return;
    }

    setIsTutorLoading(true);
    setChatError("");
    setChatInput("");
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };
    setChatMessages((current) => [...current, userMessage]);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: result.document_id,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Tutor request failed.");
      }

      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: data.answer,
          suggested_followups: data.suggested_followups ?? [],
        },
      ]);
    } catch {
      setChatError("Ask Tutor could not answer that question. Please try again.");
      setChatMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: "I couldn't answer that question. Please try again.",
        },
      ]);
    } finally {
      setIsTutorLoading(false);
    }
  }

  const activeResult = result ?? pendingResult;
  const quizAnalysis = result
    ? analyzeQuizPerformance(result.quiz, {
        selectedAnswers: selectedOptions,
        submittedAnswers,
      })
    : null;
  const score = quizAnalysis?.totalCorrect ?? 0;
  const showProcessing =
    selectedFile && ["processing", "success", "error"].includes(processingStatus);

  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          Back home
        </Link>

        {!activeResult && !showProcessing ? (
          <UploadForm
            selectedFile={selectedFile}
            error={error}
            onFileChange={handleFileChange}
            onSubmit={handleSubmit}
          />
        ) : null}

        {showProcessing && selectedFile ? (
          <ProcessingProgress
            filename={selectedFile.name}
            progress={progress}
            stage={getProcessingStage(progress)}
            status={processingStatus === "idle" ? "processing" : processingStatus}
            error={error}
            onTryAgain={handleTryAgain}
          />
        ) : null}

        {result ? (
          <>
            <ResultHeader result={result} onUploadAnother={resetForNewUpload} />
            <ResultTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className={activeTab === "study" ? "block" : "hidden"}>
              <StudyGuide summary={result.summary} />
            </div>
            <div className={activeTab === "quiz" ? "block" : "hidden"}>
              <PracticeQuiz
                quiz={result.quiz}
                selectedOptions={selectedOptions}
                submittedAnswers={submittedAnswers}
                analysis={quizAnalysis ?? analyzeQuizPerformance(result.quiz, {
                  selectedAnswers: selectedOptions,
                  submittedAnswers,
                })}
                score={score}
                onSelectOption={selectOption}
                onSubmitAnswer={submitAnswer}
                onResetQuiz={resetQuiz}
              />
            </div>
            <div className={activeTab === "tutor" ? "block" : "hidden"}>
              <AskTutor
                documentId={result.document_id}
                messages={chatMessages}
                inputValue={chatInput}
                isLoading={isTutorLoading}
                error={chatError}
                onInputChange={setChatInput}
                onAsk={askTutor}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
