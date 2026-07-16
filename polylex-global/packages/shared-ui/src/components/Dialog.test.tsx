import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Dialog } from './Dialog';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  });
});

describe('Dialog', () => {
  it('associates its title and description with the native dialog', () => {
    render(
      <Dialog open title="Delete word" description="This cannot be undone" onClose={vi.fn()}>
        Dialog content
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Delete word' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone');
    expect(dialog).toHaveAttribute('open');
  });

  it('requests close from its button, Escape, and backdrop', () => {
    const onClose = vi.fn();
    render(
      <Dialog open title="Settings" onClose={onClose}>
        Dialog content
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }));
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('restores focus when controlled open state becomes false', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { rerender } = render(
      <Dialog open title="Profile" onClose={vi.fn()}>
        Dialog content
      </Dialog>,
    );
    rerender(
      <Dialog open={false} title="Profile" onClose={vi.fn()}>
        Dialog content
      </Dialog>,
    );

    expect(opener).toHaveFocus();
    opener.remove();
  });
});
