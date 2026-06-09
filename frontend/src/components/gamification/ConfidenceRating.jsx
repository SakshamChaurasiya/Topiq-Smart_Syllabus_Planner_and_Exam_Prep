import React, { useState } from 'react';
import { missionAPI } from '../../api/mission.api';

const ConfidenceRating = ({ missionId, topicName, onRated }) => {
  const [loadingRating, setLoadingRating] = useState(null);

  const handleRating = async (rating) => {
    setLoadingRating(rating);
    try {
      if (missionId) {
        await missionAPI.updateStatus(missionId, 'completed', { confidence: rating });
      }
      if (onRated) {
        onRated(rating);
      }
    } catch (error) {
      console.error('[ConfidenceRating] Failed to save rating:', error);
    } finally {
      setLoadingRating(null);
    }
  };

  const isSubmitting = loadingRating !== null;

  return (
    <div className="confidence-panel-content">
      <span className="confidence-label">How well do you know this topic?</span>
      <div className="confidence-buttons-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          className="btn btn-sm confidence-btn"
          style={{ background: 'var(--surface)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          onClick={() => handleRating('shaky')}
          disabled={isSubmitting}
        >
          {loadingRating === 'shaky' ? '😰 Loading...' : '😰 Shaky'}
        </button>
        <button
          className="btn btn-sm confidence-btn"
          style={{ background: 'var(--surface)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          onClick={() => handleRating('okay')}
          disabled={isSubmitting}
        >
          {loadingRating === 'okay' ? '😐 Loading...' : '😐 Okay'}
        </button>
        <button
          className="btn btn-sm confidence-btn"
          style={{ background: 'var(--surface)', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          onClick={() => handleRating('solid')}
          disabled={isSubmitting}
        >
          {loadingRating === 'solid' ? '😎 Loading...' : '😎 Solid'}
        </button>
      </div>
    </div>
  );
};

export default ConfidenceRating;
