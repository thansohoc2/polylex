import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorToast, ErrorToastProvider, useErrorToast, useToast } from './ErrorToast';

describe('ErrorToast', () => {
  it('renders message', () => {
    render(<ErrorToast message="Error message" autoClose={false} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error message');
  });

  it.each([
    ['success', 'Saved'],
    ['info', 'Syncing'],
  ] as const)('renders the %s variant as a polite status', (variant, message) => {
    render(<ErrorToast message={message} variant={variant} autoClose={false} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
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

  it('preserves show while exposing variant methods from both hooks', () => {
    function Trigger() {
      const legacyToast = useErrorToast();
      const toast = useToast();
      return (
        <>
          <button type="button" onClick={() => legacyToast.show('Legacy error')}>Legacy</button>
          <button type="button" onClick={() => toast.showSuccess('Saved')}>Success</button>
          <button type="button" onClick={() => toast.showInfo('Syncing')}>Info</button>
        </>
      );
    }

    render(
      <ErrorToastProvider>
        <Trigger />
      </ErrorToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Legacy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Success' }));
    fireEvent.click(screen.getByRole('button', { name: 'Info' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Legacy error');
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });
});
