import { defineConfig } from '/workspace/work/MAVAI/node_modules/vitest/dist/config.js';
export default defineConfig({
  root: '/workspace/work/MAVAI/packages/sprites2d-core',
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
