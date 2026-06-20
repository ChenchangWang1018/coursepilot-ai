export type UploadResult = {
  document_id?: string;
  filename: string;
  num_pages: number;
  text_preview: string;
  summary: StudySummary;
  quiz: QuizItem[];
};

export type StudySummary = {
  overview: string;
  key_topics: KeyTopic[];
  must_know: string[];
  common_mistakes: string[];
  suggested_review_order: string[];
};

export type KeyTopic = {
  name: string;
  summary: string;
  details: string;
};

export type QuizOption = {
  label: OptionLabel;
  text: string;
};

export type OptionExplanation = {
  option_label: OptionLabel;
  explanation: string;
};

export type OptionLabel = "A" | "B" | "C" | "D" | "True" | "False";

export type QuizItem = {
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

export type ProcessingStage =
  | "Uploading PDF"
  | "Extracting document text"
  | "Generating study guide"
  | "Creating practice quiz";

export type ResultTab = "study" | "quiz" | "tutor";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggested_followups?: string[];
};
