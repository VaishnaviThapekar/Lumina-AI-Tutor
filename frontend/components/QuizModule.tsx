'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Trophy, Loader2 } from 'lucide-react';
import type { Quiz, QuizQuestion, QuizResult } from '@/lib/types';
import { generateQuiz, submitQuiz } from '@/lib/api';

interface QuizModuleProps {
  sessionId: number;
  documentId: number;
  competencyScore: number;
  onCompetencyUpdate: (newScore: number) => void;
  onClose: () => void;
}

const QuizModule: React.FC<QuizModuleProps> = ({
  sessionId,
  documentId,
  competencyScore,
  onCompetencyUpdate,
  onClose,
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleGenerateQuiz = async (numQuestions: number) => {
    setIsLoading(true);
    try {
      const difficulty = competencyScore < 0.5 ? 'easy' : competencyScore < 0.8 ? 'medium' : 'hard';
      const quizData = await generateQuiz(documentId, numQuestions, difficulty);
      setQuiz(quizData);
      setSelectedAnswers(new Array(quizData.questions.length).fill(-1));
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };
  
  const handleSubmit = async () => {
    if (!quiz || selectedAnswers.some(a => a === -1)) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setIsLoading(true);
    try {
      const quizResult = await submitQuiz(quiz.quiz_id, sessionId, selectedAnswers);
      setResult(quizResult);
      onCompetencyUpdate(quizResult.updated_competency_score);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Quiz selection screen
  if (!quiz) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Test Your Knowledge</h2>
        <p className="text-gray-600 mb-8">
          Choose the number of questions to assess your understanding of the material.
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          {[5, 10, 15].map((num) => (
            <button
              key={num}
              onClick={() => handleGenerateQuiz(num)}
              disabled={isLoading}
              className="p-6 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              <div className="text-3xl font-bold text-primary-600 mb-2">{num}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </button>
          ))}
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center mt-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-gray-600">Generating quiz...</span>
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    );
  }
  
  // Results screen
  if (result) {
    const percentage = Math.round(result.score * 100);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-8">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${
            percentage >= 80 ? 'text-success-500' : 
            percentage >= 60 ? 'text-primary-500' : 
            'text-warning-500'
          }`} />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
          <div className="text-5xl font-bold text-primary-600 mb-2">{percentage}%</div>
          <p className="text-gray-600">
            {result.correct_answers} out of {result.total_questions} correct
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Competency Score: {Math.round(result.updated_competency_score * 100)}%
          </p>
        </div>
        
        <div className="space-y-6">
          {result.feedback.map((item, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg border-2 ${
                item.is_correct ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {item.is_correct ? (
                  <CheckCircle className="w-6 h-6 text-success-500 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Question {item.question_number}: {item.question}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Your answer:</span>{' '}
                      <span className={item.is_correct ? 'text-success-700' : 'text-danger-700'}>
                        {item.user_answer}
                      </span>
                    </p>
                    {!item.is_correct && (
                      <p>
                        <span className="font-medium">Correct answer:</span>{' '}
                        <span className="text-success-700">{item.correct_answer}</span>
                      </p>
                    )}
                    <p className="text-gray-700 mt-3">{item.feedback}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    );
  }
  
  // Quiz taking screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Question */}
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h3>
      
      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(index)}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selectedAnswers[currentQuestion] === index
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            disabled={selectedAnswers[currentQuestion] === -1}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || selectedAnswers.some(a => a === -1)}
            className="px-6 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Quiz'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizModule;
