import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { syllabusAPI } from '../api/syllabus.api';
import { LoadingScreen } from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20, textAlign: 'center', background: 'var(--bg-base)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontWeight: 800 }}>Cheat Note Not Found</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, marginTop: 4, marginBottom: 20 }}>
          This cheat note might have been deleted, or the owner has disabled public sharing.
        </p>
        <a href="/" className="btn btn-primary">Go to Homepage</a>
      </div>
    );
  }

  const appUrl = window.location.origin;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Header */}
      <div style={{ width: '100%', maxWidth: 720, textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--primary-glow)', padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(99,102,241,0.2)' }}>
          Shared by a Smart Syllabus Planner user
        </span>
        <h1 style={{ fontWeight: 800, fontSize: '2rem', marginTop: 16, marginBottom: 8 }}>
          📚 {data.shareTitle}
        </h1>
        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Subject: {data.subjectName} {data.subjectCode ? `(${data.subjectCode})` : ''}
        </p>
      </div>

      {/* Cards List */}
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.cards && data.cards.length > 0 ? (
          data.cards.map((card, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge type={card.importance} label={card.importance.toUpperCase()} />
                <Badge type={card.difficulty === 'easy' ? 'success' : card.difficulty === 'hard' ? 'danger' : 'warning'} label={card.difficulty.toUpperCase()} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Q: {card.front}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {card.back}
              </p>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-muted)' }}>No topics included in this cheat note.</p>
          </div>
        )}
      </div>

      {/* Footer Viral Loop */}
      <div style={{ width: '100%', maxWidth: 720, textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
          Want a personalized study planner and AI-generated cheat sheets for your own subjects?
        </p>
        <a 
          href={appUrl} 
          className="btn btn-primary" 
          style={{ display: 'inline-block', textDecoration: 'none', fontWeight: 700 }}
        >
          🚀 Create your own study plan at Smart Syllabus Planner
        </a>
      </div>

    </div>
  );
};

export default SharedCheatNote;
