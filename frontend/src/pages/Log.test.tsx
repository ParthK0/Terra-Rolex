import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Log from './Log';

// Helper to mock or define onLog callback
const mockOnLog = vi.fn().mockResolvedValue({ success: true });

describe('Log Component', () => {
  it('renders Log form elements correctly', () => {
    render(<Log onLog={mockOnLog} />);

    // Verify presence of tabs
    expect(screen.getByText('Commute')).toBeDefined();
    expect(screen.getByText('Meals')).toBeDefined();
    expect(screen.getByText('Energy')).toBeDefined();
    expect(screen.getByText('Flights')).toBeDefined();

    // Verify distance input label matches default active tab
    expect(screen.getByText('Distance Traveled (km)')).toBeDefined();

    // Verify Save Carbon Record button is present
    expect(screen.getByRole('button', { name: /save carbon activity record/i })).toBeDefined();
  });

  it('updates subtype options when switching tabs', () => {
    render(<Log onLog={mockOnLog} />);

    // Switch to Food tab
    const foodTab = screen.getByText('Meals');
    fireEvent.click(foodTab);

    // Verify label changes to food units
    expect(screen.getByText('Servings / Meals')).toBeDefined();
  });

  it('displays validation error if amount is less than or equal to 0', async () => {
    render(<Log onLog={mockOnLog} />);

    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitBtn = screen.getByRole('button', { name: /save carbon activity record/i });
    fireEvent.click(submitBtn);

    // Wait for role="alert" message to appear
    await waitFor(() => {
      const alertMsg = screen.getByRole('alert');
      expect(alertMsg.textContent).toContain('Please enter a valid amount greater than 0.');
    });

    expect(mockOnLog).not.toHaveBeenCalled();
  });

  it('calls onLog with the correct arguments on valid submission', async () => {
    render(<Log onLog={mockOnLog} />);

    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '45' } });

    const descInput = screen.getByPlaceholderText(/e\.g\. Morning commute to office/i);
    fireEvent.change(descInput, { target: { value: 'Work commute' } });

    const submitBtn = screen.getByRole('button', { name: /save carbon activity record/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnLog).toHaveBeenCalledWith('transport', 'car', 45, 'Work commute');
    });

    // Verify success message is announced
    const successMsg = screen.getByRole('status');
    expect(successMsg.textContent).toContain('Activity logged successfully!');
  });
});
