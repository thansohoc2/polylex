import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('associates its label and forwarded ref with the native input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField ref={ref} label="Email" name="email" />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('name', 'email');
  });

  it('links helper and error text and exposes invalid state', () => {
    render(
      <TextField
        id="email"
        label="Email"
        helperText="Use your account email"
        error="Email is invalid"
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-describedby', 'email-helper email-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Email is invalid');
  });

  it('forwards required and disabled states', () => {
    render(<TextField label="Name" required disabled />);

    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeRequired();
    expect(input).toBeDisabled();
  });

  it('supports native value changes', () => {
    const onChange = vi.fn();
    render(<TextField label="Name" onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.change(input, { target: { value: 'PolyLex' } });

    expect(onChange).toHaveBeenCalledOnce();
    expect(input).toHaveValue('PolyLex');
  });
});
