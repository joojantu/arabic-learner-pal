
import React from 'react';
import { LessonPlan } from '../types';
import { SparklesIcon, ArrowPathIcon, LightBulbIcon } from './icons';

interface ResultsViewProps {
  lessonPlan: LessonPlan;
  score: number;
  userAnswers: (string | null)[];
  onRestartQuiz: () => void;
  onNewLesson: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ lessonPlan, score, userAnswers, onRestartQuiz, onNewLesson }) => {
  const totalQuestions = lessonPlan.quiz.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  let feedbackMessage = "";
  let feedbackEmoji = "😊";

  if (percentage === 100) {
    feedbackMessage = "Mumtaz (Excellent)! Perfect score! You're an Arabic star!";
    feedbackEmoji = "🎉🏆🌟";
  } else if (percentage >= 80) {
    feedbackMessage = "Jayyid Jiddan (Very Good)! Amazing effort! You're learning fast!";
    feedbackEmoji = "👍🤩";
  } else if (percentage >= 60) {
    feedbackMessage = "Jayyid (Good)! Well done! Keep practicing to master it!";
    feedbackEmoji = "🙂💪";
  } else if (percentage >= 40) {
    feedbackMessage = "La Ba's (Not Bad)! Good try! Review and try again!";
    feedbackEmoji = "🤔📖";
  }
   else {
    feedbackMessage = "Don't worry! Every mistake is a chance to learn. Keep going!";
    feedbackEmoji = "🌱💡";
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white shadow-2xl rounded-xl text-center animate-fadeInScale">
      <SparklesIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
      <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Quiz Complete!</h1>
      <p className="text-4xl md:text-5xl font-extrabold text-accent my-4">
        {score} <span className="text-2xl text-gray-600">/ {totalQuestions}</span>
      </p>
      <p className="text-2xl text-gray-700 mb-4">({percentage}%)</p>
      <p className="text-lg md:text-xl text-gray-800 font-medium mb-1">
        {feedbackMessage} <span role="img" aria-label="feedback emoji">{feedbackEmoji}</span>
      </p>

      {/* Optional: Detailed review (can be complex to implement well) */}
      {/* 
      <details className="text-left my-6 p-3 border rounded-md bg-gray-50">
        <summary className="font-semibold text-primary cursor-pointer hover:underline">Review Your Answers</summary>
        <ul className="mt-2 space-y-2">
          {lessonPlan.quiz.map((question, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            return (
              <li key={index} className={`p-2 border rounded-md ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <p className="font-medium text-sm text-gray-700">{index + 1}. {question.questionText}</p>
                {question.type === 'arabic_to_english_mc' && <p className="text-xs rtl text-blue-600" lang="ar" dir="rtl">Arabic: {question.arabicStimulus}</p>}
                {question.type === 'english_to_arabic_mc' && <p className="text-xs text-blue-600">English: {question.englishStimulus}</p>}
                <p className={`text-xs ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  Your answer: {userAnswer || 'Not answered'} {isCorrect ? '✔️' : '❌'}
                </p>
                {!isCorrect && <p className="text-xs text-green-700">Correct: {question.correctAnswer}</p>}
              </li>
            );
          })}
        </ul>
      </details>
      */}

      <div className="mt-10 space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
        <button
          onClick={onRestartQuiz}
          className="w-full md:w-auto flex items-center justify-center bg-secondary hover:bg-secondary-darker text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-70 active:transform active:scale-95"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Try Quiz Again
        </button>
        <button
          onClick={onNewLesson}
          className="w-full md:w-auto flex items-center justify-center bg-primary hover:bg-primary-darker text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-70 active:transform active:scale-95"
        >
          <LightBulbIcon className="w-5 h-5 mr-2" />
          Create New Lesson
        </button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fadeInScale {
          animation: fadeInScale 0.5s ease-out;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      ` }} />
    </div>
  );
};

export default ResultsView;
