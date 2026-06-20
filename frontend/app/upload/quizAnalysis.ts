import { OptionLabel, QuizItem } from "./types";

export type QuizAnswerState = {
  selectedAnswers: Record<number, OptionLabel>;
  submittedAnswers: Record<number, OptionLabel>;
  correctnessByQuestion?: Record<number, boolean>;
};

export type PerformanceBucket = {
  name: string;
  submitted: number;
  correct: number;
  accuracy: number;
};

export type MissedQuestion = {
  id: number;
  question: string;
  topic: string;
  difficulty: string;
  selectedOption: OptionLabel;
  correctOption: OptionLabel;
  correctAnswer: string;
};

export type QuizAnalysis = {
  totalSubmitted: number;
  totalCorrect: number;
  overallAccuracy: number;
  performanceByTopic: PerformanceBucket[];
  performanceByDifficulty: PerformanceBucket[];
  strongTopics: PerformanceBucket[];
  weakTopics: PerformanceBucket[];
  missedQuestions: MissedQuestion[];
  recommendedNextSteps: string[];
};

type MutableBucket = {
  submitted: number;
  correct: number;
};

const DIFFICULTY_ORDER = ["easy", "medium", "hard", "unknown"];

function normalizeTopic(topic: string | undefined) {
  const normalizedTopic = topic?.trim();
  return normalizedTopic || "Untitled topic";
}

function normalizeDifficulty(difficulty: string | undefined) {
  if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
    return difficulty;
  }

  return "unknown";
}

function normalizeText(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim();
  return normalizedValue || fallback;
}

function calculateAccuracy(correct: number, submitted: number) {
  if (submitted === 0) {
    return 0;
  }

  return Math.round((correct / submitted) * 100);
}

function createBucketList(buckets: Map<string, MutableBucket>) {
  return Array.from(buckets.entries()).map(([name, bucket]) => ({
    name,
    submitted: bucket.submitted,
    correct: bucket.correct,
    accuracy: calculateAccuracy(bucket.correct, bucket.submitted),
  }));
}

function addToBucket(
  buckets: Map<string, MutableBucket>,
  name: string,
  isCorrect: boolean,
) {
  const bucket = buckets.get(name) ?? { submitted: 0, correct: 0 };
  bucket.submitted += 1;

  if (isCorrect) {
    bucket.correct += 1;
  }

  buckets.set(name, bucket);
}

function buildRecommendations(
  analysis: Omit<QuizAnalysis, "recommendedNextSteps">,
) {
  const recommendations: string[] = [];
  const weakestTopic = analysis.weakTopics[0];
  const hardPerformance = analysis.performanceByDifficulty.find(
    (bucket) => bucket.name === "hard",
  );
  const mediumPerformance = analysis.performanceByDifficulty.find(
    (bucket) => bucket.name === "medium",
  );
  const easyPerformance = analysis.performanceByDifficulty.find(
    (bucket) => bucket.name === "easy",
  );

  if (weakestTopic) {
    recommendations.push(`Review ${weakestTopic.name} first.`);
  }

  if (hardPerformance && hardPerformance.accuracy < 70) {
    recommendations.push(
      "After reviewing the basics, do more hard application and reasoning practice.",
    );
  }

  if (mediumPerformance && mediumPerformance.accuracy < 70) {
    recommendations.push("Review core definitions and proof strategies.");
  }

  if (easyPerformance && easyPerformance.accuracy < 70) {
    recommendations.push("Review basic definitions before moving to harder practice.");
  }

  if (analysis.overallAccuracy >= 80 && analysis.totalSubmitted > 0) {
    recommendations.push("Try harder practice questions next.");
  }

  if (analysis.totalSubmitted < 5) {
    recommendations.push("Review recommendations improve after more submissions.");
  }

  if (analysis.missedQuestions.length > 0) {
    recommendations.push("Revisit the missed questions and compare them with the explanations.");
  }

  if (analysis.weakTopics.length === 0 && analysis.totalSubmitted > 0) {
    recommendations.push("Keep reinforcing your stronger topics with mixed practice.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Keep practicing and submit more answers to refine your review plan.");
  }

  return recommendations;
}

export function analyzeQuizPerformance(
  quiz: QuizItem[],
  answerState: QuizAnswerState,
): QuizAnalysis {
  const topicBuckets = new Map<string, MutableBucket>();
  const difficultyBuckets = new Map<string, MutableBucket>();
  const missedQuestions: MissedQuestion[] = [];
  let totalSubmitted = 0;
  let totalCorrect = 0;

  for (const question of quiz) {
    const submittedOption = answerState.submittedAnswers[question.id];

    if (!submittedOption) {
      continue;
    }

    const topic = normalizeTopic(question.topic);
    const difficulty = normalizeDifficulty(question.difficulty);
    const isCorrect =
      answerState.correctnessByQuestion?.[question.id] ??
      submittedOption === question.correct_option;
    totalSubmitted += 1;

    if (isCorrect) {
      totalCorrect += 1;
    } else {
      missedQuestions.push({
        id: question.id,
        question: normalizeText(question.question, `Question ${question.id}`),
        topic,
        difficulty,
        selectedOption: submittedOption,
        correctOption: question.correct_option,
        correctAnswer: normalizeText(question.correct_answer, "No answer provided."),
      });
    }

    addToBucket(topicBuckets, topic, isCorrect);
    addToBucket(difficultyBuckets, difficulty, isCorrect);
  }

  const performanceByTopic = createBucketList(topicBuckets).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const performanceByDifficulty = createBucketList(difficultyBuckets).sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.name) - DIFFICULTY_ORDER.indexOf(b.name),
  );
  const strongTopics = performanceByTopic.filter(
    (topic) => topic.submitted >= 1 && topic.accuracy >= 80,
  );
  const weakTopics = performanceByTopic
    .filter((topic) => topic.submitted >= 1 && topic.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy || a.name.localeCompare(b.name));

  const analysisWithoutRecommendations = {
    totalSubmitted,
    totalCorrect,
    overallAccuracy: calculateAccuracy(totalCorrect, totalSubmitted),
    performanceByTopic,
    performanceByDifficulty,
    strongTopics,
    weakTopics,
    missedQuestions,
  };

  return {
    ...analysisWithoutRecommendations,
    recommendedNextSteps: buildRecommendations(analysisWithoutRecommendations),
  };
}
