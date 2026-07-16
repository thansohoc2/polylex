import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import { Select } from './Select';
import { TextField } from './TextField';

const meta = {
  title: 'Primitives/Form controls',
  component: TextField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Email address', helperText: 'Used for account recovery.', placeholder: 'learner@example.com' },
};

export const Error: Story = {
  args: { label: 'Email address', value: 'invalid', error: 'Enter a valid email address.', readOnly: true },
};

export const Disabled: Story = {
  args: { label: 'Email address', value: 'learner@example.com', disabled: true, readOnly: true },
};

export const LongLabel: Story = {
  args: {
    label: 'The language you understand best and want PolyLex to use for explanations',
    helperText: 'This can be changed later in your profile.',
  },
};

export const SelectionControls: Story = {
  args: { label: 'Unused story control' },
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', width: 'min(28rem, 90vw)' }}>
      <Select
        label="Learning language"
        defaultValue="ja"
        options={[{ value: 'ja', label: 'Japanese' }, { value: 'pt', label: 'Portuguese' }]}
      />
      <Checkbox label="Enable daily reminders" helperText="You can disable reminders at any time." defaultChecked />
      <Checkbox label="I agree to the learning data policy" error="Agreement is required." />
    </div>
  ),
};
