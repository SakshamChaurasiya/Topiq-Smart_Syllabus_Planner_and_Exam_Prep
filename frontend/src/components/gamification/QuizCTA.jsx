import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import QuickQuiz from './QuickQuiz';

const QuizCTA = ({ completedMissions = [], onQuizComplete, defaultMessage }) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizTopic, setQuizTopic] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleStartQuiz = () => {
    // Pick a random study mission from completedMissions where topicName exists
    const validMissions = completedMissions.filter(m => m.topicName);
    if (validMissions.length === 0) {
      toast.error("No study topics found for quiz.");
      return;
    }
    const randomMission = validMissions[Math.floor(Math.random() * validMissions.length)];
    const subjectId = randomMission.subjectId?._id || randomMission.subjectId;
    
    setQuizTopic({
      topicName: randomMission.topicName,
      subjectId
    });
    setShowQuiz(true);
  };

  if (!showQuiz) {
    return (
      <div className="quiz-cta-wrap card animate-fade-in" style={{ padding: '16px 20px', position: 'relative' }}>
        <button 
          className="quiz-cta-dismiss" 
          onClick={() => setDismissed(true)}
          aria-label="Dismiss quiz prompt"
        >
          ✕
        </button>
        <div className="quiz-cta-message">
          {defaultMessage}
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleStartQuiz}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '8px auto 0' }}
        >
          <Zap size={13} style={{ color: 'var(--warning)' }} /> Quick Quiz — Test your knowledge & earn bonus XP
        </button>
        <div className="quiz-cta-sub">
          Optional · Takes ~2 minutes · Up to +30 XP
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ padding: '16px 20px' }}>
      <QuickQuiz
        topicName={quizTopic.topicName}
        subjectId={quizTopic.subjectId}
        onComplete={(result) => {
          setShowQuiz(false);
          onQuizComplete(result);
        }}
        onSkip={() => setShowQuiz(false)}
      />
    </div>
  );
};

export default QuizCTA;
