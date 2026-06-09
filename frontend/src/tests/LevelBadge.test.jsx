import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LevelBadge from '../components/gamification/LevelBadge';

describe('LevelBadge Component', () => {
  it('renders level number correctly', () => {
    render(<LevelBadge level={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders correct emoji for level 1 (📖)', () => {
    render(<LevelBadge level={1} />);
    expect(screen.getByText('📖')).toBeInTheDocument();
  });

  it('renders correct emoji for level 50 (💀)', () => {
    render(<LevelBadge level={50} />);
    expect(screen.getByText('💀')).toBeInTheDocument();
  });

  it('sm size applies correct CSS class', () => {
    const { container } = render(<LevelBadge level={5} size="sm" />);
    // Check if the container element has the level-badge-sm class
    const badgeContainer = container.querySelector('.level-badge-sm');
    expect(badgeContainer).toBeInTheDocument();
  });
});
