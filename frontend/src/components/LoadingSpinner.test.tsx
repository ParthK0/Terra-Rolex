import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toBeInTheDocument();
  });

  it('contains the loading text visually hidden', () => {
    render(<LoadingSpinner />);
    const srOnlyText = screen.getByText('Loading...');
    expect(srOnlyText).toBeInTheDocument();
    expect(srOnlyText).toHaveClass('sr-only');
  });
});
