export type ExamType = 'jee_main' | 'jee_advanced' | 'neet';
export type Subject = 'physics' | 'chemistry' | 'mathematics' | 'biology';
export type StreamType = 'jee' | 'neet';

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'numerical'
  | 'integer'
  | 'matrix_match'
  | 'paragraph';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionStatus =
  | 'not_visited'
  | 'not_answered'
  | 'answered'
  | 'marked_for_review'
  | 'answered_and_marked';

export interface Option {
  id: string;
  text: string;
}

export interface MatrixMatchItem {
  list1: { id: string; text: string }[];
  list2: { id: string; text: string }[];
}

export interface ParagraphContext {
  id: string;
  title: string;
  passageText: string;
  linkedQuestionIds: string[];
}

export type QuestionPatternType =
  | 'assertion_reason'
  | 'statement_eval'
  | 'numerical_calculation'
  | 'graphical_analysis'
  | 'multi_concept_synthesis'
  | 'standard_pyq_mcq'
  | 'match_the_following';

export interface Question {
  id: string;
  subject: Subject;
  chapter?: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  type: QuestionType;
  patternType?: QuestionPatternType;
  patternLabel?: string;
  text: string;
  options?: Option[];
  correctAnswer: string | string[];
  numericalTolerance?: number;
  solution: string;
  formula?: string;
  pyqReference?: string;
  pyqPatternRef?: string;
  pyqYear?: number;
  section?: string;
  source?: 'HCV' | 'Irodov' | 'PYQ' | 'AI_NTA' | 'AI_ADVANCED';
  diagramSvg?: string;
  notebookSolution?: {
    given: string;
    concept: string;
    steps: string[];
    conclusion: string;
    pitfall?: string;
  };
  matrixMatch?: MatrixMatchItem;
  paragraphContext?: ParagraphContext;
  verificationStatus?: 'verified' | 'flagged' | 'healed';
  conceptDepthRating?: number;
}

export interface StudentResponse {
  selectedOption?: string;
  selectedOptions?: string[];
  numericalValue?: string;
  matrixSelections?: Record<string, string[]>;
  status: QuestionStatus;
  timeSpentSeconds: number;
  visitedCount: number;
}

export interface QuestionSpec {
  id: string;
  subject: Subject;
  chapter: string;
  type: QuestionType;
  patternType?: QuestionPatternType;
  patternLabel?: string;
  difficulty: Difficulty;
  section: string;
  source?: 'HCV' | 'Irodov' | 'PYQ' | 'AI_NTA' | 'AI_ADVANCED';
  pyqArchetype?: string;
  examType: ExamType;
  pyqYearRange?: {
    startYear: number;
    endYear: number;
  };
}

export interface CustomSyllabusConfig {
  examType: ExamType;
  selectedChapters: Record<Subject, string[]>;
  totalQuestions: number;
  durationMinutes: number;
  difficultyDistribution: {
    medium: number;
    hard: number;
  };
  pyqYearRange?: {
    startYear: number;
    endYear: number;
  };
}

export interface MockTestConfig {
  id: string;
  title: string;
  subtitle: string;
  examType: ExamType;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  description: string;
  difficulty: 'Balanced' | 'Tough' | 'Speed Focus' | 'Advanced Benchmark';
  subjectsIncluded: Subject[];
  seriesCategory?: 'class_11' | 'class_12' | 'complete_jee_main' | 'jee_advanced';
  classLevel?: '11' | '12' | 'full';
  badge?: string;
  tags?: string[];
}

export interface PipelineProgress {
  stage: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  stageName: string;
  percentage: number;
  currentStep: string;
  rejectedCount: number;
  verifiedCount: number;
  totalNeeded: number;
  patternBreakdown?: Record<string, number>;
}

export interface EphemeralTestSession {
  id: string;
  title: string;
  examType: ExamType;
  syllabusSummary: Record<Subject, string[]>;
  durationMinutes: number;
  startTime: number;
  endTime?: number;
  questions: Question[];
  responses: Record<string, StudentResponse>;
  isCompleted: boolean;
  proctorStrikes: number;
  autoSubmittedForProctoring?: boolean;
}

export type TestSession = EphemeralTestSession;

export interface ChapterAnalytics {
  chapter: string;
  subject: Subject;
  totalAsked: number;
  correct: number;
  accuracy: number;
  timeSpentSeconds: number;
  status: 'Mastered' | 'Needs Review' | 'Critical Weakness';
}

export interface PersistentPerformanceRecord {
  id: string;
  timestamp: number;
  examType: ExamType;
  title: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  predictedPercentile: number;
  predictedRank: number;
  accuracy: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  timeSpentSeconds: number;
  subjectScores: Record<
    Subject,
    { score: number; maxScore: number; accuracy: number; attempted: number }
  >;
  chapterAnalytics: ChapterAnalytics[];
  weakChapters: string[];
  strongChapters: string[];
  aiRecommendations: string[];
  proctorStrikes?: number;
  aiDiagnosis?: any;
  subjectBreakdown?: any;
}

export type PerformanceAnalysis = PersistentPerformanceRecord;

export interface ChapterFormula {
  subject: Subject;
  chapter: string;
  keyConcepts: string[];
  formulas: { title: string; latex: string; explanation: string; caution?: string }[];
  highYieldTips: string[];
  commonTraps: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phoneNumber?: string;
  stream: StreamType;
  classLevel: '11' | '12' | 'dropper';
  targetCollege: string;
  targetRank: string;
  avatarUrl?: string;
  customSupabaseUrl?: string;
  customSupabaseKey?: string;
  syncEnabled: boolean;
}

export interface LibraryBook {
  id: string;
  title: string;
  subject: Subject | 'other';
  category: 'class_11' | 'class_12' | 'reference' | 'advanced_physics';
  fileName: string;
  fileUrl: string;
  fileSize: string;
  description: string;
  badge?: string;
}

export interface StudyNote {
  id: string;
  title: string;
  subject: Subject;
  content: string;
  updatedAt: number;
}
