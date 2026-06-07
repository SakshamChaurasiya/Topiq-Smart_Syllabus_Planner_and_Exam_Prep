import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { syllabusAPI } from '../api/syllabus.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import { AlertTriangle, Rocket, BookOpen } from 'lucide-react';

const SharedCheatNote = () => {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await syllabusAPI.getPublicCheatNote(shareToken);
        setData(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Shared cheat note not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [shareToken]);

  if (loading) return <LoadingScreen text="Loading shared cheat note..." />;

  if (!data) {
    return (
      <div className="error-page-layout">
        <AlertTriangle className="error-page-icon" size={48} />
        <h2 className="error-page-title">Cheat Note Not Found</h2>
        <p className="error-page-desc">
          This cheat note might have been deleted, or the owner has disabled public sharing.
        </p>
        <a href="/" className="btn btn-primary">Go to Homepage</a>
      </div>
    );
  }

  const appUrl = window.location.origin;

  return (
    <div className="public-note-layout">
      
      {/* Header */}
      <div className="public-note-header">
        <span className="public-note-badge">
          Shared by a Topiq user
        </span>
        <h1 className="public-note-title">
          {data.shareTitle}
        </h1>
        <p className="public-note-subject">
          Subject: {data.subjectName} {data.subjectCode ? `(${data.subjectCode})` : ''}
        </p>
      </div>

      {/* Cards List */}
      <div className="public-note-cards-list">
        {data.cards && data.cards.length > 0 ? (
          data.cards.map((card, i) => (
            <div key={i} className="public-note-card">
              <div className="public-note-card-badges">
                <Badge type={card.importance} label={card.importance.toUpperCase()} />
                <Badge type={card.difficulty === 'easy' ? 'success' : card.difficulty === 'hard' ? 'danger' : 'warning'} label={card.difficulty.toUpperCase()} />
              </div>
              <h3 className="public-note-card-question">
                Q: {card.front}
              </h3>
              <p className="public-note-card-answer">
                {card.back}
              </p>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--txt-3)' }}>No topics included in this cheat note.</p>
          </div>
        )}
      </div>

      {/* Footer Viral Loop */}
      <div className="viral-loop-footer">
        <p className="viral-loop-text">
          Want a personalized study planner and AI-generated cheat sheets for your own subjects?
        </p>
        <a 
          href={appUrl} 
          className="btn btn-primary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Rocket size={14} /> Create your own study plan at Topiq
        </a>
      </div>

    </div>
  );
};

export default SharedCheatNote;
