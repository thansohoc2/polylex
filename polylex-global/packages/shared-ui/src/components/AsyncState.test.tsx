import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AsyncState } from './AsyncState';

describe('AsyncState', () => {
  it('renders an accessible loading state', () => {
    render(<AsyncState status="loading" loadingLabel="Loading vocabulary" />);
    expect(screen.getByRole('status', { name: 'Loading vocabulary' })).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    render(
      <AsyncState status="empty" emptyTitle="No words" emptyMessage="Add your first word" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No words');
    expect(screen.getByRole('status')).toHaveTextContent('Add your first word');
  });

  it('renders an error and invokes retry', () => {
    const onRetry = vi.fn();
    render(
      <AsyncState status="error" errorMessage="Could not load words" onRetry={onRetry} retryLabel="Reload" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load words');
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders children only for success', () => {
    render(
      <AsyncState status="success">
        <div>Loaded content</div>
      </AsyncState>,
    );
    expect(screen.getByText('Loaded content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
