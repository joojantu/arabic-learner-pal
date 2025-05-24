
import React, { useState, useEffect, useCallback } from 'react';
import { LessonPlan, QuizQuestion, QuizOptionArabic } from '../types';
import useTextToSpeech from '../hooks/useTextToSpeech';
import { SpeakerIcon, CheckIcon, XMarkIcon } from './icons';

interface QuizViewProps {
  lessonPlan: LessonPlan;
  onQuizComplete: (score: number, userAnswers: (string | null)[]) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ lessonPlan, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(() => Array(lessonPlan.quiz.length).fill(null));

  const { speak, isSpeaking, isSupported, availableArabicVoice, cancel } = useTextToSpeech();
  const currentQuestion = lessonPlan.quiz[currentQuestionIndex];

  // Auto-play audio for certain question types when they become current
  useEffect(() => {
    if (currentQuestion && !isAnswered) { // Only play if not already answered
      const audioToPlay = 
        (currentQuestion.type === 'listen_and_choose_meaning_mc' && currentQuestion.audioSrc) ||
        (currentQuestion.type === 'arabic_to_english_mc' && currentQuestion.audioSrc);

      if (audioToPlay && isSupported) {
         speak(audioToPlay); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [currentQuestionIndex, currentQuestion?.type, isAnswered]); // Removed 'speak' as it's stable via useCallback

  // Cancel speech on component unmount or when question changes and it was speaking
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        cancel();
      }
    };
  }, [cancel, isSpeaking, currentQuestionIndex]);


  const handleAnswerSelect = useCallback((answer: string) => {
    if (isAnswered) return;

    cancel(); // Stop any ongoing speech
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    if (answer === currentQuestion.correctAnswer) {
      setScore(prevScore => prevScore + 1);
    }
  }, [isAnswered, currentQuestion, userAnswers, currentQuestionIndex, cancel]);

  const handleNextQuestion = useCallback(() => {
    cancel(); // Stop any ongoing speech
    if (currentQuestionIndex < lessonPlan.quiz.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onQuizComplete(score, userAnswers);
    }
  }, [currentQuestionIndex, lessonPlan.quiz.length, onQuizComplete, score, userAnswers, cancel]);

  const getOptionText = useCallback((option: string | QuizOptionArabic): string => {
    return typeof option === 'string' ? option : option.arabic;
  }, []);
  
  const getOptionAudioSrc = useCallback((option: string | QuizOptionArabic): string | undefined => {
     return typeof option !== 'string' ? option.audioSrc : undefined;
  }, []);

  if (!currentQuestion) {
    return <div className="text-center p-8 text-xl text-gray-700" role="alert">Loading quiz questions...</div>;
  }

  const progressPercentage = ((currentQuestionIndex + 1) / lessonPlan.quiz.length) * 100;

  const playStimulusAudio = (audioSrc?: string) => {
    if (audioSrc && isSupported) {
      speak(audioSrc);
    }
  };

  const playOptionAudio = (e: React.MouseEvent<HTMLButtonElement>, audioSrc?: string) => {
    e.stopPropagation(); // Prevent selecting the answer when clicking the audio icon
    if (audioSrc && isSupported) {
      speak(audioSrc);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-5 md:p-8 bg-white shadow-2xl rounded-xl animate-slideUp">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span aria-live="polite">Question {currentQuestionIndex + 1} of {lessonPlan.quiz.length}</span>
          <span aria-live="polite">Score: {score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
          <div 
            className="bg-accent h-3 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Quiz progress: ${Math.round(progressPercentage)}%`}
          ></div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3 text-center min-h-[3em] flex items-center justify-center">
        {currentQuestion.questionText}
      </h2>
      
      {/* Stimulus for Arabic to English or Listen and Choose */}
      {(currentQuestion.type === 'arabic_to_english_mc' || currentQuestion.type === 'listen_and_choose_meaning_mc') && (
        <div className="flex items-center justify-center my-4 p-3 bg-blue-50 rounded-lg min-h-[80px]">
          {currentQuestion.type === 'arabic_to_english_mc' && (
             <p className="text-3xl md:text-4xl font-bold text-primary rtl" lang="ar" dir="rtl">{currentQuestion.arabicStimulus}</p>
          )}
          {currentQuestion.audioSrc && isSupported && (
            <button
              onClick={() => playStimulusAudio(currentQuestion.audioSrc)}
              disabled={isSpeaking}
              className={`ml-4 p-2 rounded-full hover:bg-blue-100 text-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 ${currentQuestion.type === 'listen_and_choose_meaning_mc' ? 'bg-secondary text-white hover:bg-secondary-darker' : ''}`}
              aria-label={currentQuestion.type === 'listen_and_choose_meaning_mc' ? "Listen to Arabic audio" : `Play audio for ${currentQuestion.arabicStimulus}`}
            >
              <SpeakerIcon className="w-7 h-7" />
              {currentQuestion.type === 'listen_and_choose_meaning_mc' && <span className="ml-2 font-semibold">Listen</span>}
            </button>
          )}
        </div>
      )}

      {/* Stimulus for English to Arabic */}
      {currentQuestion.type === 'english_to_arabic_mc' && (
         <p className="text-2xl md:text-3xl font-semibold text-primary my-6 text-center">{currentQuestion.englishStimulus}</p>
      )}
      
      {/* TTS Support Messages */}
      {!isSupported && (currentQuestion.type === 'listen_and_choose_meaning_mc' || (currentQuestion.type !== 'english_to_arabic_mc' && currentQuestion.audioSrc)) && (
         <p className="text-center text-xs text-red-600 bg-red-100 p-2 rounded-md my-2">
          Audio playback unavailable: Text-to-speech not supported in your browser.
        </p>
      )}
       {isSupported && !availableArabicVoice && (currentQuestion.type === 'listen_and_choose_meaning_mc' || (currentQuestion.type !== 'english_to_arabic_mc' && currentQuestion.audioSrc)) && (
         <p className="text-center text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md my-2">
          No Arabic voice found. Audio quality may be affected.
        </p>
      )}

      {/* Answer Options */}
      <div className="space-y-3 mt-6">
        {currentQuestion.options.map((option, index) => {
          const optionText = getOptionText(option);
          const optionAudioSrc = getOptionAudioSrc(option);
          const isCorrectChoice = optionText === currentQuestion.correctAnswer;
          const isSelectedChoice = selectedAnswer === optionText; 

          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-150 ease-in-out text-lg shadow-sm flex items-center justify-between ";
          let ariaDescription = "";

          if (isAnswered) {
            if (isCorrectChoice) {
              buttonClass += "bg-green-100 border-accent text-accent-darker font-semibold ring-2 ring-accent";
              ariaDescription = "Correct answer.";
            } else if (isSelectedChoice && !isCorrectChoice) {
              buttonClass += "bg-red-100 border-danger text-danger font-semibold ring-2 ring-danger";
              ariaDescription = "Incorrect answer selected.";
            } else {
              buttonClass += "bg-gray-100 border-gray-300 text-gray-600 opacity-70 cursor-not-allowed";
              ariaDescription = "Option not selected.";
            }
          } else {
            buttonClass += "bg-white border-gray-300 hover:bg-blue-50 hover:border-primary text-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/50";
          }
          
          const isRtlOption = typeof option !== 'string';

          return (
            <button
              key={`${currentQuestionIndex}-${index}-${optionText}`}
              onClick={() => handleAnswerSelect(optionText)}
              disabled={isAnswered}
              className={`${buttonClass} ${isRtlOption ? 'rtl' : ''}`}
              lang={isRtlOption ? 'ar' : 'en'}
              dir={isRtlOption ? 'rtl' : 'ltr'}
              aria-describedby={isAnswered ? `feedback-${index}` : undefined}
            >
              <span className={`flex-grow ${isRtlOption ? 'text-2xl' : ''}`}>{optionText}</span>
              <div className="flex items-center ml-2">
                {isAnswered && isSelectedChoice && (isCorrectChoice ? 
                    <CheckIcon className="w-6 h-6 text-accent" aria-label="Correct" /> : 
                    <XMarkIcon className="w-6 h-6 text-danger" aria-label="Incorrect" />
                )}
                {optionAudioSrc && isSupported && (
                  <button 
                    onClick={(e) => playOptionAudio(e, optionAudioSrc)}
                    disabled={isSpeaking && selectedAnswer !== null } // Disable other audio buttons when one is playing after answer
                    className={`p-1 rounded-full ${isSpeaking ? 'text-gray-400 cursor-default' : 'text-primary hover:text-blue-700 hover:bg-blue-100'} ml-2 focus:outline-none focus:ring-1 focus:ring-primary`}
                    aria-label={`Play audio for option ${optionText}`}
                  >
                    <SpeakerIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              {isAnswered && <span id={`feedback-${index}`} className="sr-only">{ariaDescription}</span>}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mt-8 text-center">
          <button
            onClick={handleNextQuestion}
            className="bg-primary hover:bg-primary-darker text-white font-bold py-3 px-8 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-70 active:transform active:scale-95"
          >
            {currentQuestionIndex < lessonPlan.quiz.length - 1 ? 'Next Question' : 'Show Results'}
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />
    </div>
  );
};

export default QuizView;
