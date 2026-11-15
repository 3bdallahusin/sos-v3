import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@sos/domain': path.resolve(currentDir, '../../packages/domain/src/index.ts'),
      '@sos/contracts': path.resolve(currentDir, '../../packages/contracts/src/index.ts'),
      '@sos/persistence': path.resolve(currentDir, '../../packages/persistence/src/index.ts'),
      '@sos/ui': path.resolve(currentDir, '../../packages/ui/src/index.ts')
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
});
