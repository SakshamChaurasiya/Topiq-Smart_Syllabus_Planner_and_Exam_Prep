import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BadgeShelf from '../components/gamification/BadgeShelf';
import { BADGES_FRONTEND } from '../constants/badges';

describe('BadgeShelf Component', () => {
  it('renders all 7 badge slots', () => {
    const { container } = render(<BadgeShelf badges={[]} />);
    const badgeElements = container.querySelectorAll('.achievement-badge');
    expect(badgeElements.length).toBe(7);
  });

  it('earned badges count matches passed badges array length', () => {
    const earnedBadges = [
      { badgeId: 'first_blood', earnedAt: new Date().toISOString() },
      { badgeId: 'crisis_survivor', earnedAt: new Date().toISOString() }
    ];
    render(<BadgeShelf badges={earnedBadges} />);
    
    const countElement = screen.getByTestId('badge-shelf-count');
    expect(countElement).toHaveTextContent('2 / 7 badges earned');
  });

  it('unearned badges render as locked', () => {
    const earnedBadges = [
      { badgeId: 'first_blood', earnedAt: new Date().toISOString() }
    ];
    const { container } = render(<BadgeShelf badges={earnedBadges} />);
    
    // first_blood is earned, the rest 6 are locked
    const lockedElements = container.querySelectorAll('.achievement-badge.locked');
    expect(lockedElements.length).toBe(6);

    const earnedElements = container.querySelectorAll('.achievement-badge.earned');
    expect(earnedElements.length).toBe(1);
  });
});
