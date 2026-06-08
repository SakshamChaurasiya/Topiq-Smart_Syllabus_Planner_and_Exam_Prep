import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfidenceRating from '../components/gamification/ConfidenceRating';
import { missionAPI } from '../api/mission.api';

// Mock the missionAPI
jest.mock('../api/mission.api', () => ({
  missionAPI: {
    updateStatus: jest.fn(() => Promise.resolve({ data: { success: true } })),
  },
}));

describe('ConfidenceRating Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: renders three emoji buttons
  it('renders three emoji buttons', () => {
    render(<ConfidenceRating missionId="123" topicName="Test Topic" onRated={() => {}} />);
    expect(screen.getByText('How well do you know this topic?')).toBeInTheDocument();
    expect(screen.getByText('😰 Shaky')).toBeInTheDocument();
    expect(screen.getByText('😐 Okay')).toBeInTheDocument();
    expect(screen.getByText('😎 Solid')).toBeInTheDocument();
  });

  // Test 2: clicking a button calls missionAPI.updateStatus with correct confidence value
  it('clicking shaky button calls updateStatus with confidence shaky', async () => {
    render(<ConfidenceRating missionId="123" topicName="Test Topic" onRated={() => {}} />);
    fireEvent.click(screen.getByText('😰 Shaky'));
    expect(missionAPI.updateStatus).toHaveBeenCalledWith('123', 'completed', { confidence: 'shaky' });
  });

  // Test 3: buttons are disabled during submission
  it('buttons are disabled during submission', async () => {
    let resolvePromise;
    missionAPI.updateStatus.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<ConfidenceRating missionId="123" topicName="Test Topic" onRated={() => {}} />);
    fireEvent.click(screen.getByText('😐 Okay'));

    expect(screen.getByText('😰 Shaky')).toBeDisabled();
    expect(screen.getByText('😐 Loading...')).toBeDisabled();
    expect(screen.getByText('😎 Solid')).toBeDisabled();

    resolvePromise({ data: { success: true } });
    await waitFor(() => expect(screen.getByText('😐 Okay')).not.toBeDisabled());
  });

  // Test 4: onRated callback fires after successful submission
  it('onRated callback fires after successful submission', async () => {
    const onRatedMock = jest.fn();
    render(<ConfidenceRating missionId="123" topicName="Test Topic" onRated={onRatedMock} />);
    fireEvent.click(screen.getByText('😎 Solid'));

    await waitFor(() => {
      expect(onRatedMock).toHaveBeenCalledWith('solid');
    });
  });
});
