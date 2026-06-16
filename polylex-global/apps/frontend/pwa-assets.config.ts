import { defineConfig } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: 'default',
  },
  preset: {
    transparent: {
      sizes: [64, 144, 192, 512],
      favicons: [[64, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: '#0F172A' },
    },
    apple: {
      sizes: [180],
      resizeOptions: { background: '#0F172A' },
    },
  },
  images: ['public/icons/icon.svg'],
});
