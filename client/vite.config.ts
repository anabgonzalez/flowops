import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Env vars live in the monorepo root .env, not client/.env -- keep one
  // source of truth for config across server and client.
  envDir: path.resolve(__dirname, '..'),
})
