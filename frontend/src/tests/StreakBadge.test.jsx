import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StreakBadge from '../components/gamification/StreakBadge';

describe('StreakBadge Component', () => {
  it('renders flame and streak number correctly', () => {
    render(<StreakBadge streak={5} />);
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  it('renders freeze badge when freezeTokens > 0', () => {
    render(<StreakBadge streak={5} freezeTokens={2} />);
    expect(screen.getByText('🧊')).toBeInTheDocument();
  });

  it('does NOT render freeze badge when freezeTokens is 0', () => {
    render(<StreakBadge streak={5} freezeTokens={0} />);
    expect(screen.queryByText('🧊')).not.toBeInTheDocument();
  });

  it('tooltip text contains correct token count', () => {
    render(<StreakBadge streak={5} freezeTokens={3} />);
    const tooltipText = "You have 3 Streak Freeze token(s). Your streak is protected if you miss a day.";
    expect(screen.getByText(tooltipText)).toBeInTheDocument();
  });
});
