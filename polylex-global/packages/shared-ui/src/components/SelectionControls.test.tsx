import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';

describe('selection controls', () => {
  it('keeps native controlled and uncontrolled checkbox behavior', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Remember me" defaultChecked onChange={onChange} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Remember me' });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('exposes switch state and requests a controlled state change', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notifications" checked={false} onCheckedChange={onCheckedChange} />);

    const switchControl = screen.getByRole('switch', { name: 'Notifications' });
    expect(switchControl).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(switchControl);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not activate a disabled switch', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notifications" checked disabled onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
