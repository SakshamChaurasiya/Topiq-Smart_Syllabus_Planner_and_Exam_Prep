import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementBadge from '../components/gamification/AchievementBadge';

describe('AchievementBadge Component', () => {
  const badgeDef = {
    id: 'first_blood',
    emoji: '🎯',
    name: 'First Blood',
    desc: 'Completed your first mission',
    color: '#6366f1'
  };

  it('renders emoji and name', () => {
    const badge = { ...badgeDef, earnedAt: new Date().toISOString() };
    render(<AchievementBadge badge={badge} />);
    
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('First Blood')).toBeInTheDocument();
  });

  it('locked badge has grayscale styling', () => {
    const badge = { ...badgeDef, earnedAt: null };
    const { container } = render(<AchievementBadge badge={badge} />);
    
    const badgeElement = container.querySelector('.achievement-badge');
    expect(badgeElement).toHaveClass('locked');
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });

  it('earned badge shows earnedAt in tooltip', () => {
    const earnedAt = '2026-06-09T00:00:00.000Z'; // MM/DD/YYYY formatted is 06/09/2026
    const badge = { ...badgeDef, earnedAt };
    render(<AchievementBadge badge={badge} />);
    
    // Tooltip should contain MM/DD/YYYY format
    expect(screen.getByText(/Earned 06\/09\/2026/)).toBeInTheDocument();
  });

  it('sm size renders smaller circle than md size', () => {
    const badge = { ...badgeDef, earnedAt: null };
    
    const { container: containerSm } = render(<AchievementBadge badge={badge} size="sm" />);
    const emojiSm = containerSm.querySelector('.badge-emoji');
    const widthSm = emojiSm.style.width;

    const { container: containerMd } = render(<AchievementBadge badge={badge} size="md" />);
    const emojiMd = containerMd.querySelector('.badge-emoji');
    const widthMd = emojiMd.style.width;

    expect(parseInt(widthSm)).toBeLessThan(parseInt(widthMd));
  });
});
