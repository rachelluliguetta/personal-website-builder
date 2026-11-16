// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { resolveProfileSource } from './src/lib/profile-source.mjs';

// The files/ folder of the active profile (my-profile/ or example-profile/)
// is published at the root of the site: files/photo.jpg becomes /photo.jpg.
const source = resolveProfileSource();

export default defineConfig({
  publicDir: source.filesDir,
  vite: {
    plugins: [tailwindcss()],
  },
});
