import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { subjectAPI } from '../../api/subject.api';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ratings = [
  { value: 'terrible', emoji: '😰', label: 'Terrible' },
  { value: 'hard',     emoji: '😟', label: 'Hard' },
  { value: 'okay',     emoji: '😐', label: 'Okay' },
  { value: 'good',     emoji: '😊', label: 'Good' },
  { value: 'crushed',  emoji: '🎉', label: 'Crushed!' }
];

const helpOptions = [
  { value: 'yes',      emoji: '👍', label: 'Yes' },
  { value: 'somewhat', emoji: '🤔', label: 'Somewhat' },
  { value: 'no',       emoji: '👎', label: 'Not really' }
];

const ExamReviewModal = ({ subject, isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(null);
  const [hardestTopic, setHardestTopic] = useState('');
  const [topiqHelpfulness, setTopiqHelpfulness] = useState(null);
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setRating(null);
      setHardestTopic('');
      setTopiqHelpfulness(null);
      setReflection('');
      setSubmitting(false);
      setConfirmDelete(false);
    }
  }, [isOpen]);

  const handleSubmit = async (action) => {
    setSubmitting(true);
    try {
      await subjectAPI.submitExamReview(subject._id, {
        rating,
        hardestTopic: hardestTopic || null,
        topiqHelpfulness: topiqHelpfulness || null,
        reflection: reflection || null,
        action
      });
      onSubmit(action, { rating, hardestTopic, topiqHelpfulness });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save review.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTitle = () => {
    if (step === 1) return `🎓 How did your ${subject?.name || 'subject'} exam go?`;
    if (step === 2) return 'Quick reflection (optional)';
    return `What would you like to do with ${subject?.name || 'subject'}?`;
  };

  const renderFooter = () => {
    if (step === 1) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!rating}
            onClick={() => setStep(2)}
          >
            Next →
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--txt-3)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            Skip for now
          </button>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ flex: 1 }}
            onClick={() => setStep(1)}
          >
            ← Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => setStep(3)}
          >
            Next →
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      footer={renderFooter()}
      size="md"
    >
      {submitting ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <LoadingSpinner size="lg" text="Saving review..." />
        </div>
      ) : (
        <>
          {step === 1 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--txt-3)', textAlign: 'center', marginBottom: 16 }}>
                Be honest — this helps improve your future plans
              </p>
              <div className="rating-btn-row">
                {ratings.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    className={`btn rating-btn ${rating === r.value ? 'selected' : ''}`}
                    onClick={() => setRating(r.value)}
                  >
                    <span className="rating-btn-emoji">{r.emoji}</span>
                    <span className="rating-btn-label">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--txt-3)', marginBottom: 20 }}>
                Skip if you're in a hurry
              </p>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                  What was the hardest topic?
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Deadlocks, Normalization..."
                  value={hardestTopic}
                  onChange={(e) => setHardestTopic(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                  Did Topiq help you prepare?
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {helpOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`btn rating-btn btn-sm ${topiqHelpfulness === opt.value ? 'selected' : ''}`}
                      style={{ flex: 1, minWidth: 'auto', padding: '8px 12px' }}
                      onClick={() => setTopiqHelpfulness(opt.value)}
                    >
                      <span className="rating-btn-emoji" style={{ fontSize: '1.1rem' }}>{opt.emoji}</span>
                      <span className="rating-btn-label" style={{ fontSize: '0.65rem' }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                  Anything you'd do differently?
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  maxLength={200}
                  placeholder="Optional — max 200 characters"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--txt-3)', marginTop: 4 }}>
                  {reflection.length}/200
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              {/* Option 1: Archive */}
              <div
                className="review-action-card archive"
                onClick={() => handleSubmit('archive')}
              >
                <span className="review-action-card-icon">📦</span>
                <div>
                  <div className="review-action-card-title">Archive it</div>
                  <div className="review-action-card-desc">
                    Keep all data for reference. Moves to your Completed Exams section.
                  </div>
                </div>
              </div>

              {/* Option 2: Delete */}
              <div
                className="review-action-card delete"
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                  }
                }}
                style={{ cursor: confirmDelete ? 'default' : 'pointer' }}
              >
                <span className="review-action-card-icon">🗑️</span>
                <div style={{ width: '100%' }}>
                  <div className="review-action-card-title">Delete everything</div>
                  {confirmDelete ? (
                    <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>
                        Are you sure? This cannot be undone.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={submitting}
                          onClick={() => handleSubmit('delete')}
                        >
                          Yes, delete
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="review-action-card-desc">
                      Permanently removes subject, syllabus, plan, and all missions.
                    </div>
                  )}
                </div>
              </div>

              {/* Option 3: Keep active */}
              <div
                className="review-action-card keep"
                onClick={() => handleSubmit('keep')}
              >
                <span className="review-action-card-icon">🔁</span>
                <div>
                  <div className="review-action-card-title">Keep it active</div>
                  <div className="review-action-card-desc">
                    Exam was rescheduled or I want to keep studying.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default ExamReviewModal;
