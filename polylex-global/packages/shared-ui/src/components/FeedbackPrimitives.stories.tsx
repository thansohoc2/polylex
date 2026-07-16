import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AsyncState } from './AsyncState';
import { Dialog } from './Dialog';
import { ErrorToast } from './ErrorToast';

const meta = {
  title: 'Primitives/Feedback',
  component: AsyncState,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AsyncState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { args: { status: 'loading', loadingLabel: 'Loading vocabulary' } };
export const Empty: Story = { args: { status: 'empty', emptyTitle: 'No words yet', emptyMessage: 'Add a word to begin learning.' } };
export const ErrorWithRetry: Story = {
  args: { status: 'error', errorTitle: 'Unable to load', errorMessage: 'Check your connection and try again.', retryLabel: 'Try again', onRetry: () => undefined },
};

export const ToastVariants: Story = {
  args: { status: 'success' },
  render: () => (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <ErrorToast message="The request could not be completed." autoClose={false} />
      <ErrorToast message="Your changes were saved." variant="success" autoClose={false} />
      <ErrorToast message="A new lesson is available." variant="info" autoClose={false} />
    </div>
  ),
};

function DialogFixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <Dialog
        open={open}
        title="Delete note?"
        description="This action cannot be undone."
        closeLabel="Close dialog"
        onClose={() => setOpen(false)}
        footer={<button type="button" onClick={() => setOpen(false)}>Cancel</button>}
      >
        <p>The vocabulary item remains available in your main list.</p>
      </Dialog>
    </>
  );
}

export const ModalDialog: Story = {
  args: { status: 'success' },
  render: () => <DialogFixture />,
};
