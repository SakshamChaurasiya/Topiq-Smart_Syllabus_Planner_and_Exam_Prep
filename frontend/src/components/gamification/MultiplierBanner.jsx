import React, { useState } from 'react';
import { X } from 'lucide-react';

const MultiplierBanner = ({ multiplier, reason, active }) => {
  const [dismissed, setDismissed] = useState(false);

  if (!active || dismissed) return null;

  // If multiplier === 2: banner uses --danger color (red/urgent feel)
  // If multiplier === 1.5: banner uses --warning color (orange)
  const borderLeftColor = multiplier === 2 ? 'var(--danger)' : 'var(--warning)';

  return (
    <div 
      className="card multiplier-banner animate-fade-in" 
      style={{ borderLeft: `3px solid ${borderLeftColor}` }}
    >
      <div className="multiplier-banner-text">
        {reason} — All XP earned today is boosted!
      </div>
      <button 
        className="multiplier-banner-dismiss" 
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default MultiplierBanner;
