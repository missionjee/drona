import {
  Question,
  StudentResponse,
  Subject,
  PersistentPerformanceRecord,
  ChapterAnalytics,
  ExamType,
} from '../types';

export function calculatePerformanceRecord(
  questions: Question[],
  responses: Record<string, StudentResponse>,
  examType: ExamType,
  durationMinutes: number,
  sessionTitle: string = 'Custom Mock Test'
): PersistentPerformanceRecord {
  let totalScore = 0;
  let maxScore = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;

  const subjectScores: Record<
    Subject,
    { score: number; maxScore: number; accuracy: number; attempted: number }
  > = {
    physics: { score: 0, maxScore: 0, accuracy: 0, attempted: 0 },
    chemistry: { score: 0, maxScore: 0, accuracy: 0, attempted: 0 },
    mathematics: { score: 0, maxScore: 0, accuracy: 0, attempted: 0 },
    biology: { score: 0, maxScore: 0, accuracy: 0, attempted: 0 },
  };

  const chapterMap: Record<
    string,
    { subject: Subject; totalAsked: number; correct: number; timeSpentSeconds: number }
  > = {};

  let totalTimeSpentSeconds = 0;

  questions.forEach((q) => {
    const sub = q.subject;
    const resp = responses[q.id];
    const qMarks = 4;
    const negMarks = -1;

    maxScore += qMarks;
    if (!subjectScores[sub]) {
      subjectScores[sub] = { score: 0, maxScore: 0, accuracy: 0, attempted: 0 };
    }
    subjectScores[sub].maxScore += qMarks;

    const chName = q.chapter || q.topic || 'General Chapter';
    if (!chapterMap[chName]) {
      chapterMap[chName] = { subject: sub, totalAsked: 0, correct: 0, timeSpentSeconds: 0 };
    }
    chapterMap[chName].totalAsked++;

    const hasAnswered =
      resp &&
      (resp.status === 'answered' || resp.status === 'answered_and_marked') &&
      (resp.selectedOption !== undefined ||
        (resp.selectedOptions && resp.selectedOptions.length > 0) ||
        (resp.numericalValue !== undefined && resp.numericalValue.trim() !== '') ||
        (resp.matrixSelections && Object.keys(resp.matrixSelections).length > 0));

    if (resp?.timeSpentSeconds) {
      chapterMap[chName].timeSpentSeconds += resp.timeSpentSeconds;
      totalTimeSpentSeconds += resp.timeSpentSeconds;
    }

    if (!hasAnswered) {
      totalUnattempted++;
      return;
    }

    totalAttempted++;
    subjectScores[sub].attempted++;

    let isCorrect = false;

    if (q.type === 'single_choice') {
      isCorrect =
        resp?.selectedOption?.trim().toUpperCase() ===
        String(q.correctAnswer).trim().toUpperCase();
    } else if (q.type === 'multiple_choice') {
      if (Array.isArray(q.correctAnswer) && resp?.selectedOptions) {
        const setA = new Set(q.correctAnswer);
        const setB = new Set(resp.selectedOptions);
        isCorrect = setA.size === setB.size && [...setA].every((v) => setB.has(v));
      }
    } else if (q.type === 'numerical' || q.type === 'integer') {
      const sVal = parseFloat(resp?.numericalValue || '0');
      const cVal = parseFloat(String(q.correctAnswer));
      isCorrect = Math.abs(sVal - cVal) <= (q.numericalTolerance ?? 0.05);
    } else {
      isCorrect = resp?.selectedOption === q.correctAnswer;
    }

    if (isCorrect) {
      totalCorrect++;
      totalScore += qMarks;
      subjectScores[sub].score += qMarks;
      chapterMap[chName].correct++;
    } else {
      totalIncorrect++;
      totalScore += negMarks;
      subjectScores[sub].score += negMarks;
    }
  });

  // Calculate subject accuracies
  (['physics', 'chemistry', 'mathematics', 'biology'] as Subject[]).forEach((sub) => {
    const s = subjectScores[sub];
    s.accuracy = s.attempted > 0 ? Math.max(0, Math.round((s.score / (s.attempted * 4)) * 100)) : 0;
  });

  // Overall accuracy
  const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const percentage = maxScore > 0 ? Math.max(0, (totalScore / maxScore) * 100) : 0;

  // Predict percentile
  let predictedPercentile = 0;
  if (percentage >= 85) predictedPercentile = 99.5 + (percentage - 85) * 0.03;
  else if (percentage >= 70) predictedPercentile = 98.0 + (percentage - 70) * 0.1;
  else if (percentage >= 50) predictedPercentile = 93.0 + (percentage - 50) * 0.25;
  else if (percentage >= 35) predictedPercentile = 80.0 + (percentage - 35) * 0.86;
  else predictedPercentile = Math.max(10, percentage * 2.2);

  predictedPercentile = Math.min(99.99, Math.max(1.0, predictedPercentile));

  // Predict AIR
  const totalCandidates = examType === 'neet' ? 2200000 : 1400000;
  const predictedRank = Math.max(
    1,
    Math.round(totalCandidates * (1 - predictedPercentile / 100))
  );

  // Chapter analytics
  const chapterAnalytics: ChapterAnalytics[] = Object.entries(chapterMap).map(
    ([chName, data]) => {
      const chAccuracy =
        data.totalAsked > 0 ? Math.round((data.correct / data.totalAsked) * 100) : 0;

      let status: 'Mastered' | 'Needs Review' | 'Critical Weakness' = 'Needs Review';
      if (chAccuracy >= 75) status = 'Mastered';
      else if (chAccuracy < 40) status = 'Critical Weakness';

      return {
        chapter: chName,
        subject: data.subject,
        totalAsked: data.totalAsked,
        correct: data.correct,
        accuracy: chAccuracy,
        timeSpentSeconds: data.timeSpentSeconds,
        status,
      };
    }
  );

  const weakChapters = chapterAnalytics
    .filter((c) => c.status === 'Critical Weakness')
    .map((c) => c.chapter);

  const strongChapters = chapterAnalytics
    .filter((c) => c.status === 'Mastered')
    .map((c) => c.chapter);

  const aiRecommendations: string[] = [];
  if (accuracy < 60) {
    aiRecommendations.push('High negative mark deduction detected. Restrict blind guessing.');
  }
  if (weakChapters.length > 0) {
    aiRecommendations.push(`Targeted revision required in: ${weakChapters.slice(0, 3).join(', ')}.`);
  }
  if (percentage >= 70) {
    aiRecommendations.push('Solid grasp of foundational concepts. Ready for higher difficulty tests.');
  }

  return {
    id: `record-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    examType,
    title: sessionTitle,
    totalScore,
    maxScore,
    percentage,
    predictedPercentile,
    predictedRank,
    accuracy,
    totalAttempted,
    totalCorrect,
    totalIncorrect,
    totalUnattempted,
    timeSpentSeconds: totalTimeSpentSeconds || durationMinutes * 60,
    subjectScores,
    chapterAnalytics,
    weakChapters,
    strongChapters,
    aiRecommendations,
  };
}
