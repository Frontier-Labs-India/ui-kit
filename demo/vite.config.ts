import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Where the demo is served from. GitHub Pages serves it under /ui-kit/;
  // ui.frontier-labs.in serves it at the root (DEMO_BASE=/).
  base: process.env.DEMO_BASE ?? '/ui-kit/',
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, '../src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
  },
})
