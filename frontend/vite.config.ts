import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Allow access from local network
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../localhost+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../localhost+2.pem')),
    },
  },
}); 