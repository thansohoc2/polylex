import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'disabled', label: 'Unavailable', disabled: true },
] as const;

describe('Select', () => {
  it('renders options and supports native selection', () => {
    const onChange = vi.fn();
    render(<Select label="Language" options={options} defaultValue="en" onChange={onChange} />);

    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(screen.getAllByRole('option')).toHaveLength(3);
    fireEvent.change(select, { target: { value: 'vi' } });

    expect(select).toHaveValue('vi');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('supports native option children', () => {
    render(
      <Select label="Level">
        <option value="a1">A1</option>
      </Select>,
    );

    expect(screen.getByRole('option', { name: 'A1' })).toBeInTheDocument();
  });

  it('forwards disabled state', () => {
    render(<Select label="Language" options={options} disabled />);
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeDisabled();
  });

  it('links accessible error text', () => {
    render(<Select id="language" label="Language" options={options} error="Choose a language" />);

    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', 'language-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a language');
  });
});
