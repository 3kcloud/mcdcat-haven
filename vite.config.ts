import { defineConfig } from 'vite';

// 相对路径 base 便于静态托管 / Vercel；build 输出 dist/
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
