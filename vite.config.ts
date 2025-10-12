import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

const hmrHost = process.env.VITE_HMR_HOST;

export default defineConfig({
  plugins: [
    svelte(),
    crx({ manifest }),
  ],


  server: {
    hmr: hmrHost
      ? {
          clientPort: Number(process.env.VITE_HMR_PORT ?? 443),
          host: hmrHost,
          protocol: process.env.VITE_HMR_PROTOCOL ?? 'wss'
        }
      : undefined
      }
})
