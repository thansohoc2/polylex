import type { Preview } from '@storybook/react';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'Playful Light',
      values: [{ name: 'Playful Light', value: '#fbf6f2' }],
    },
    viewport: {
      viewports: {
        mobile320: { name: 'Mobile 320', styles: { width: '320px', height: '720px' } },
        mobile375: { name: 'Mobile 375', styles: { width: '375px', height: '812px' } },
        mobile430: { name: 'Mobile 430', styles: { width: '430px', height: '932px' } },
        tablet768: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' } },
        desktop1024: { name: 'Desktop 1024', styles: { width: '1024px', height: '768px' } },
      },
    },
    a11y: {
      config: { rules: [{ id: 'color-contrast', enabled: true }] },
    },
    layout: 'centered',
  },
};

export default preview;
