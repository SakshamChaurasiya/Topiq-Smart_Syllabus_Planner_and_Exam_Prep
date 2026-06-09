import React, { useState, useEffect } from 'react';
import { quizAPI } from '../../api/quiz.api';

const QuickQuiz = ({ topicName, subjectId, onComplete, onSkip }) => {
  const [quizState, setQuizState] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    const loadQuiz = async () => {
      try {
        const res = await quizAPI.generate(topicName, subjectId);
        if (active) {
          if (res.data?.success && res.data?.data?.questions) {
            setQuestions(res.data.data.questions);
            setQuizState('ready');
          } else {
            setQuizState('error');
          }
        }
      } catch (err) {
        if (active) {
          setQuizState('error');
        }
      }
    };
    loadQuiz();
    return () => { active = false; };
  }, [topicName, subjectId]);

  if (quizState === 'loading') {
    return (
      <div className="quiz-loading-container animate-fade-in" style={{ padding: '20px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 10px', width: 24, height: 24, borderWidth: 2.5, borderStyle: 'solid', borderColor: 'var(--accent) transparent var(--accent) transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p className="quiz-loading-text" style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>
          Generating quiz for "{topicName}"...
        </p>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="quiz-error-container animate-fade-in" style={{ padding: '20px 0', textAlign: 'center' }}>
        <p className="quiz-error-text" style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '12px' }}>
          Quiz unavailable right now.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={onSkip}>
          Skip
        </button>
      </div>
    );
  }

  if ((quizState === 'ready' || quizState === 'answering') && questions.length > 0) {
    const q = questions[currentQ];
    if (!q) return null;

    const isLast = currentQ === 2;

    const handleNext = async () => {
      if (selectedIndex === null) return;
      const updatedAnswers = [...answers, selectedIndex];
      setAnswers(updatedAnswers);
      if (!isLast) {
        setCurrentQ(prev => prev + 1);
        setSelectedIndex(null);
      } else {
        setQuizState('loading');
        try {
          const res = await quizAPI.submit(updatedAnswers, questions);
          if (res.data?.success) {
            setResult(res.data.data);
            setQuizState('submitted');
          } else {
            setQuizState('error');
          }
        } catch (err) {
          setQuizState('error');
        }
      }
    };

    const progressPercent = ((currentQ + 1) / 3) * 100;

    return (
      <div className="quiz-container animate-fade-in" style={{ textAlign: 'left' }}>
        <div className="quiz-progress-bar-wrap">
          <div className="quiz-progress-label">Question {currentQ + 1} of 3</div>
          <div className="progress-bar" style={{ height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        <div className="quiz-question-text" style={{ margin: '14px 0' }}>
          {q.question}
        </div>

        <div className="quiz-options-list">
          {q.options.map((option, idx) => (
            <button
              key={idx}
              className={`quiz-option-btn ${selectedIndex === idx ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(idx)}
            >
              {option}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleNext}
            disabled={selectedIndex === null}
          >
            {isLast ? 'Submit' : 'Next →'}
          </button>
          <button className="quiz-skip-link" onClick={onSkip}>
            Skip quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizState === 'submitted' && result) {
    const { score, bonusXP, results, confidence, leveledUp, user } = result;

    let scoreMessage = '';
    let scoreColor = '';

    if (score === 3) {
      scoreMessage = '🎯 Perfect!';
      scoreColor = 'var(--success)';
    } else if (score === 2) {
      scoreMessage = '😊 Almost!';
      scoreColor = 'var(--info)';
    } else if (score === 1) {
      scoreMessage = '📚 Keep going';
      scoreColor = 'var(--warning)';
    } else {
      scoreMessage = '😰 Review this topic';
      scoreColor = 'var(--danger)';
    }

    return (
      <div className="quiz-results-container animate-fade-in" style={{ textAlign: 'left' }}>
        <div className="quiz-score-display" style={{ color: scoreColor, textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, marginBottom: 12 }}>
          {score}/3 {scoreMessage}
        </div>

        {bonusXP > 0 && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="badge badge-success">+{bonusXP} XP</span>
          </div>
        )}

        <div className="quiz-results-list" style={{ marginBottom: 20 }}>
          {questions.map((q, idx) => {
            const isCorrect = results[idx]?.correct;
            return (
              <div key={idx} className="quiz-result-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: '1.1rem', marginRight: 4 }}>
                  {isCorrect ? '✅' : '❌'}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--txt)' }}>Question {idx + 1}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginTop: 2 }}>
                    {results[idx]?.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => onComplete({ score, bonusXP, confidence, leveledUp, user })}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuickQuiz;
