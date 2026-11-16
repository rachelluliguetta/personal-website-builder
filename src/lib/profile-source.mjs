// Decides which profile folder the site is built from.
// Shared by astro.config.mjs (to serve the folder's files/) and profile.ts.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Your own profile (git-ignored) wins; otherwise the bundled example is used.
const CANDIDATES = ['my-profile', 'example-profile'];

/** @returns {{ dir: string, name: string, profileFile: string, filesDir: string }} */
export function resolveProfileSource(root = process.cwd()) {
  const name = CANDIDATES.find((candidate) => existsSync(join(root, candidate, 'profile.yaml')));
  if (!name) {
    throw new Error(`No profile found. Create my-profile/profile.yaml (copy example-profile/ to start).`);
  }
  const dir = join(root, name);
  return { dir, name, profileFile: join(dir, 'profile.yaml'), filesDir: join(dir, 'files') };
}
