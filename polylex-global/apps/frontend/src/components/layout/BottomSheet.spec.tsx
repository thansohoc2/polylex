import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import BottomSheet from './BottomSheet';

describe('BottomSheet', () => {
  it('renders at the document root so fixed positioning uses the viewport', () => {
    render(
      <div style={{ transform: 'translateY(100px)' }}>
        <BottomSheet isOpen onClose={() => {}} title="Add note">
          <input aria-label="Term" />
        </BottomSheet>
      </div>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Add note' });

    expect(dialog.parentElement).toBe(document.body);
    expect(dialog.classList.contains('fixed')).toBe(true);
    expect(dialog.classList.contains('bottom-0')).toBe(true);
  });

  it('keeps focus on a child input when the close callback changes', () => {
    const { rerender } = render(
      <BottomSheet isOpen onClose={() => {}} title="Add note">
        <input aria-label="Term" />
      </BottomSheet>,
    );
    const input = screen.getByRole('textbox', { name: 'Term' });
    input.focus();

    rerender(
      <BottomSheet isOpen onClose={() => {}} title="Add note">
        <input aria-label="Term" />
      </BottomSheet>,
    );

    expect(document.activeElement).toBe(input);
  });

  it('uses the latest close callback for the Escape key', () => {
    const firstOnClose = vi.fn();
    const latestOnClose = vi.fn();
    const { rerender } = render(
      <BottomSheet isOpen onClose={firstOnClose} title="Add note">
        <input aria-label="Term" />
      </BottomSheet>,
    );

    rerender(
      <BottomSheet isOpen onClose={latestOnClose} title="Add note">
        <input aria-label="Term" />
      </BottomSheet>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(firstOnClose).not.toHaveBeenCalled();
    expect(latestOnClose).toHaveBeenCalledTimes(1);
  });
});