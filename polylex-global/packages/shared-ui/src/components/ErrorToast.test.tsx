import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorToast } from './ErrorToast';

describe('ErrorToast', () => {
  it('renders message', () => {
    render(<ErrorToast message="Error message" autoClose={false} />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('auto closes after duration', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<ErrorToast message="Auto close" duration={500} onClose={onClose} />);

    expect(screen.getByText('Auto close')).toBeInTheDocument();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
