import { defineConfig } from 'astro/config';
import { resolve } from 'path';

export default defineConfig({
  site: 'https://enspirit.github.io',
  base: '/elo',
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@enspirit/elo': resolve('../src/index.ts')
      }
    },
    optimizeDeps: {
      include: [
        'dayjs',
        'dayjs/plugin/duration',
        'dayjs/plugin/isoWeek',
        'dayjs/plugin/quarterOfYear',
        'dayjs/plugin/utc'
      ]
    }
  }
});
