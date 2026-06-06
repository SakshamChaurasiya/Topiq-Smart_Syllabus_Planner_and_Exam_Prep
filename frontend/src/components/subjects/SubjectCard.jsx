// SubjectCard.jsx — Individual subject card in the grid
import { useNavigate } from 'react-router-dom';
import ProgressRing from '../ui/ProgressRing';
import Badge from '../ui/Badge';
import { format } from 'date-fns';

const difficultyColors = { easy: 'var(--success)', medium: 'var(--warning)', hard: 'var(--danger)' };
const priorityType    = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const daysLeft = subject.examDate
    ? Math.max(0, Math.ceil((new Date(subject.examDate) - new Date()) / 86400000))
    : null;

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
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: daysLeft <= 3 ? 'var(--danger)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                {format(new Date(subject.examDate), 'dd MMM')} — {daysLeft}d left
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-disabled)' }}>No exam set</div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(subject)}
            title="Edit subject"
          >✏️</button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(subject)}
            title="Delete subject"
          >🗑️</button>
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;
