
export interface VocabularyItem {
  arabic: string;
  english: string;
  transliteration: string;
  audioSrc: string; // Text to be spoken for Arabic
}

export interface PhraseItem {
  arabic: string;
  english: string;
  transliteration: string;
  audioSrc: string; // Text to be spoken for Arabic
}

// Represents an option in a multiple-choice question where the option itself is in Arabic
export interface QuizOptionArabic {
  arabic: string; // The Arabic text of the option
  audioSrc: string; // Text to be spoken for this Arabic option
}

// A quiz option can be a simple English string or an Arabic option object
export type QuizOption = string | QuizOptionArabic;

// Base structure for all quiz questions
export interface BaseQuizQuestion {
  questionText: string; // The main text of the question
  correctAnswer: string; // The string representation of the correct answer (matches English text or Arabic text from QuizOptionArabic)
}

// Quiz: Translate Arabic word/phrase to English (Multiple Choice)
export interface ArabicToEnglishMCQuiz extends BaseQuizQuestion {
  type: 'arabic_to_english_mc';
  arabicStimulus: string; // The Arabic word/phrase to be translated
  audioSrc: string; // Text to be spoken for the Arabic stimulus
  options: string[]; // Array of English meaning options
}

// Quiz: Translate English word/phrase to Arabic (Multiple Choice)
export interface EnglishToArabicMCQuiz extends BaseQuizQuestion {
  type: 'english_to_arabic_mc';
  englishStimulus: string; // The English word/phrase to be translated
  options: QuizOptionArabic[]; // Array of Arabic options (each with text and audioSrc)
  // correctAnswer will be the `arabic` property of one of the options
}

// Quiz: Listen to Arabic word/phrase and choose the correct English meaning (Multiple Choice)
export interface ListenAndChooseMeaningMCQuiz extends BaseQuizQuestion {
  type: 'listen_and_choose_meaning_mc';
  audioSrc: string; // Text to be spoken for the Arabic stimulus that needs to be understood
  options: string[]; // Array of English meaning options
}

export type QuizQuestion = ArabicToEnglishMCQuiz | EnglishToArabicMCQuiz | ListenAndChooseMeaningMCQuiz;

export interface LessonPlan {
  title: string;
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  quiz: QuizQuestion[];
}

export type AppView = 'setup' | 'loading' | 'lesson' | 'quiz' | 'results' | 'error' | 'apiKeyMissing';

// For grounding metadata from Gemini Search (if ever used, not in current scope)
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web: GroundingChunkWeb;
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}
