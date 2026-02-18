import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 1. Load env vars from .env files
    const env = loadEnv(mode, '.', '');
    
    // 2. CRITICAL: Check both the loaded file env AND the system process.env (for Vercel)
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Now this will grab the key correctly even on Vercel
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});