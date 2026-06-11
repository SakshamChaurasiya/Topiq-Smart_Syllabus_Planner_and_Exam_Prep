// SubjectCard.jsx — Individual subject card in the grid
import { useNavigate } from 'react-router-dom';
import ProgressRing from '../ui/ProgressRing';
import Badge from '../ui/Badge';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { subjectAPI } from '../../api/subject.api';

const difficultyColors = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--danger)' };
const priorityType    = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };

const SubjectCard = ({ subject, onEdit, onDelete, onReview }) => {
  const navigate = useNavigate();
  const daysLeft = subject.examDate
    ? Math.max(0, Math.ceil((new Date(subject.examDate) - new Date()) / 86400000))
    : null;

  const examPassed = subject.examDate && daysLeft === 0 &&
    new Date(subject.examDate) < new Date();
  // More precise: exam date is in the past (not just 0 days left)
  const examActuallyPassed = subject.examDate &&
    new Date(subject.examDate) < new Date() &&
    !subject.isArchived;
  const hasReview = !!subject.examReview?.completedAt;
  const dismissCount = subject.examReview?.reviewDismissedCount || 0;
  const showReviewBanner = examActuallyPassed && !hasReview && dismissCount < 3;

  const progressColor = subject.progress >= 70 ? 'var(--success)' : subject.progress >= 40 ? 'var(--warning)' : 'var(--primary)';

  return (
    <div
      className="subject-card"
      onClick={() => navigate(`/subjects/${subject._id}/syllabus`)}
    >
      {/* Color accent bar */}
      <div className="subject-card-accent" style={{ background: subject.color || '#6366f1' }} />

      <div className="subject-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="subject-icon"
            style={{ background: subject.color || '#6366f1' }}
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 2 }}>
              {subject.name}
            </div>
            {subject.code && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                {subject.code}
              </div>
            )}
          </div>
        </div>
        <ProgressRing
          percent={subject.progress || 0}
          size={52}
          stroke={4}
          color={progressColor}
        />
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge type={priorityType[subject.priority] || 'medium'} label={subject.priority} dot />
        <Badge
          type={subject.difficulty === 'easy' ? 'success' : subject.difficulty === 'hard' ? 'danger' : 'warning'}
          label={subject.difficulty}
        />
        {subject.hasSyllabus && <Badge type="info" label="Syllabus ✓" />}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {subject.completedTopics || 0}/{subject.totalTopics || 0} topics
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: progressColor }}>
            {subject.progress || 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${subject.progress || 0}%`, background: progressColor }}
          />
        </div>
      </div>

      {/* Exam countdown + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {subject.examDate ? (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Exam Date</div>
              {examActuallyPassed && hasReview ? (
                // Already reviewed — show rating badge
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                    Exam Done
                  </span>
                  <span style={{ fontSize: '0.85rem' }}>
                    {{ terrible:'😰', hard:'😟', okay:'😐', good:'😊', crushed:'🎉' }[subject.examReview?.rating]}
                  </span>
                </div>
              ) : (
                <div style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: daysLeft <= 3 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--txt-2)'
                }}>
                  {format(new Date(subject.examDate), 'dd MMM')} — {daysLeft}d left
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>No exam date set</div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={() => onEdit(subject)}
            title="Edit subject"
          ><Pencil size={13} strokeWidth={2} /></button>
          <button
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => onDelete(subject)}
            title="Delete subject"
          ><Trash2 size={13} strokeWidth={2} /></button>
        </div>
      </div>

      {showReviewBanner && (
        <div
          className="exam-review-banner animate-fade-in"
          onClick={(e) => { e.stopPropagation(); onReview(subject); }}
        >
          <span className="exam-review-banner-emoji">🎓</span>
          <span className="exam-review-banner-text">
            Exam day passed — how did it go?
          </span>
          <span className="exam-review-banner-cta">Review →</span>
          <button
            className="exam-review-banner-dismiss"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await subjectAPI.dismissReview(subject._id);
              } catch {}
              // Optimistically hide — parent refetch will sync
            }}
            title="Dismiss"
          >✕</button>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
