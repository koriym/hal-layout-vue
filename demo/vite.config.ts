import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  base: '/hal-layout-vue/demo/',
  plugins: [vue()],
  resolve: {
    alias: {
      'hal-layout-vue': path.resolve(__dirname, '../src/index.ts'),
      'vue': path.resolve(__dirname, 'node_modules/vue'),
    },
  },
});
