
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, LessonPlan, UploadedFile } from './types';
import TopicInputForm from './components/TopicInputForm';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import { geminiService } from './services/geminiService';
import { LightBulbIcon, AlertTriangleIcon } from './components/icons';
import { MISSING_API_KEY_MSG } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('loading'); // Start in loading to check API key
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Specific for Gemini API calls
  const [error, setError] = useState<string | null>(null);
  
  // API Key Check
  useEffect(() => {
    if (!geminiService.isApiKeyConfigured()) {
      setError(
        `Application is not configured correctly. The Gemini API key is missing or invalid. 
        Please ensure the API_KEY environment variable is set up before building/running the application. 
        It should not be "${MISSING_API_KEY_MSG}".`
      );
      setCurrentView('apiKeyMissing');
    } else {
      setCurrentView('setup'); // API key exists, proceed to setup
    }
  }, []);


  const handleTopicsSubmit = useCallback(async (topics: string, file?: UploadedFile) => {
    if (!geminiService.isApiKeyConfigured()) {
      setCurrentView('apiKeyMissing');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentView('loading');
    try {
      const plan = await geminiService.generateLessonPlan(topics, file);
      setLessonPlan(plan);
      setCurrentView('lesson');
    } catch (err) {
      console.error("Error in handleTopicsSubmit:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred while generating the lesson.";
      setError(`Failed to generate lesson: ${message}. Check console for details.`);
      setCurrentView('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (lessonPlan && lessonPlan.quiz && lessonPlan.quiz.length > 0) {
      setQuizScore(0);
      setUserQuizAnswers(Array(lessonPlan.quiz.length).fill(null));
      setCurrentView('quiz');
    } else {
      setError("Cannot start quiz: No quiz questions found in the lesson plan.");
      setCurrentView('error'); // Or back to 'lesson' with a message
    }
  }, [lessonPlan]);

  const handleQuizComplete = useCallback((score: number, answers: (string | null)[]) => {
    setQuizScore(score);
    setUserQuizAnswers(answers);
    setCurrentView('results');
  }, []);

  const handleRestartQuiz = useCallback(() => {
    handleStartQuiz(); 
  }, [handleStartQuiz]);

  const handleNewLesson = useCallback(() => {
    setLessonPlan(null);
    setError(null);
     if (!geminiService.isApiKeyConfigured()) {
      setCurrentView('apiKeyMissing');
    } else {
      setCurrentView('setup');
    }
  }, []);

  const renderView = () => {
    if (currentView === 'apiKeyMissing') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-red-50 p-4 md:p-8 rounded-lg shadow-xl max-w-lg mx-auto">
          <AlertTriangleIcon className="w-16 h-16 text-danger mb-4" />
          <h1 className="text-2xl font-bold text-danger mb-3 text-center">Configuration Error</h1>
          <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{error}</p>
           <p className="text-sm text-gray-500 text-center">This app requires a valid Google Gemini API key to function. Please refer to the setup instructions.</p>
        </div>
      );
    }
    
    if (currentView === 'loading' || isLoading ) { // Show loading if general loading or API specific loading
      return (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="loader mb-4"></div> {/* Defined in index.html style */}
          <p className="text-xl text-gray-700">
            {isLoading && currentView === 'loading' ? "Generating your amazing Arabic lesson..." : "Loading..."}
          </p>
          <p className="text-sm text-gray-500">This might take a moment, shukran for your patience!</p>
        </div>
      );
    }
    
    if (currentView === 'error') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-red-50 p-4 md:p-8 rounded-lg shadow-xl max-w-lg mx-auto">
          <AlertTriangleIcon className="w-16 h-16 text-danger mb-4" />
          <h1 className="text-2xl font-bold text-danger mb-3 text-center">Oops! Something Went Wrong</h1>
          <p className="text-gray-700 text-center mb-6 whitespace-pre-line">{error || "An unexpected error occurred. Please try again."}</p>
          <button
            onClick={handleNewLesson}
            className="bg-primary hover:bg-primary-darker text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'setup':
        return <TopicInputForm onSubmit={handleTopicsSubmit} isLoading={isLoading} />;
      case 'lesson':
        if (lessonPlan) {
          return <LessonView lessonPlan={lessonPlan} onStartQuiz={handleStartQuiz} />;
        }
        setError("Lesson data is missing. Please try creating a new lesson.");
        setCurrentView('error'); // Should not happen if logic is correct
        return null; 
      case 'quiz':
        if (lessonPlan) {
          return <QuizView lessonPlan={lessonPlan} onQuizComplete={handleQuizComplete} />;
        }
        setError("Quiz data is missing. Please try creating a new lesson.");
        setCurrentView('error'); // Should not happen
        return null;
      case 'results':
        if (lessonPlan) {
          return <ResultsView lessonPlan={lessonPlan} score={quizScore} userAnswers={userQuizAnswers} onRestartQuiz={handleRestartQuiz} onNewLesson={handleNewLesson} />;
        }
        setError("Results data is missing. Please try creating a new lesson.");
        setCurrentView('error'); // Should not happen
        return null;
      default:
        // Fallback to setup if view is unknown and API key is fine
        if (geminiService.isApiKeyConfigured()) {
            setCurrentView('setup');
        } else {
            setCurrentView('apiKeyMissing');
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex flex-col items-center p-2 sm:p-4 selection:bg-secondary selection:text-white">
       <header className="w-full max-w-5xl mx-auto py-4 md:py-6 px-2 sm:px-4">
         <div className="flex items-center">
           <LightBulbIcon className="w-10 h-10 md:w-12 md:h-12 text-secondary mr-2 sm:mr-3 drop-shadow-md" />
           <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
             Arabic Learner PAL
           </h1>
         </div>
       </header>
       <main className="w-full flex-grow flex items-center justify-center p-2 sm:p-4">
        {renderView()}
       </main>
        <footer className="w-full text-center py-4 text-xs sm:text-sm text-gray-500 mt-auto">
            Powered by Google Gemini. Learn Arabic, the fun way! &copy; {new Date().getFullYear()}
        </footer>
    </div>
  );
};

export default App;
