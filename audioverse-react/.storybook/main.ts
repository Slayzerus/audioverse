import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/components/**/*.stories.@(tsx|ts|jsx|js)'],
  addons: ['@storybook/addon-essentials'],
  docs: { autodocs: true },
};

export default config;
