import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { resolveProfileSource } from './profile-source.mjs';

// my-profile/ (git-ignored) if it exists, otherwise example-profile/.
// Astro commands run from the project root, so the lookup starts there.
const SOURCE = resolveProfileSource();
const PROFILE_FILE = `${SOURCE.name}/profile.yaml`;

const RTL_LANGUAGES = new Set(['he', 'ar', 'fa', 'ur']);
const isUrl = (v: string) => /^https?:\/\//.test(v);

// A file name inside the profile's files/ folder ("photo.jpg") or a full http(s) URL.
const assetPath = z
  .string()
  .min(1)
  .refine((v) => isUrl(v) || !v.split(/[\\/]/).includes('..'), {
    message: 'must be a file inside files/ (like "photo.jpg") or a full http(s) URL',
  });

// Only http(s) links, so nothing like "javascript:" can end up in a link.
const webUrl = z.url({ protocol: /^https?$/, message: 'must be a full http(s) URL' });

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex color like "#963454"');

const defaultTheme = {
  background: '#F8F6F1',
  text: '#26372E',
  accent: '#963454',
  soft: '#DCE3D0',
};

const defaultLabels = {
  about: 'About me',
  contact: 'Contact',
  downloadCv: 'Download CV',
  contactMe: 'Get in touch',
  letsTalk: "Let's talk",
};

const profileSchema = z.object({
  language: z.string().min(2).default('en'),
  // Where the site will be published, e.g. "https://janedoe.dev". Used for link
  // previews (LinkedIn, WhatsApp, Slack), which need full URLs to show your photo.
  siteUrl: webUrl.optional(),
  name: z.string().min(1),
  title: z.string().min(1),
  // Part of the title shown in the accent color, e.g. "Engineer".
  titleHighlight: z.string().optional(),
  location: z.string().optional(),
  // Shown as a small badge above the title, e.g. "Available for new opportunities".
  availability: z.string().optional(),
  photo: assetPath.optional(),
  // Which part of the photo stays in the circle (CSS object-position), e.g. "50% 20%".
  photoPosition: z
    .string()
    .regex(/^[a-z0-9.%\s-]+$/i, 'must look like "50% 20%" or "center top"')
    .default('50% 50%'),
  // Browser tab icon: "initials" (default), up to 3 characters or an emoji,
  // or your own .svg, .png or .ico file in files/ (or a URL).
  favicon: z.string().min(1).default('initials'),
  pitch: z.string().optional(),
  skills: z.array(z.string().min(1)).default([]),
  about: z.string().min(1),
  cv: z.object({ file: assetPath }).optional(),
  // All optional. With none of them, the page has no contact section and no
  // "Get in touch" / "Let's talk" buttons. Strict, so a typo is reported.
  contacts: z
    .strictObject({
      email: z.email().optional(),
      linkedin: webUrl.optional(),
      github: webUrl.optional(),
    })
    .default({}),
  theme: z
    .object({
      background: hexColor.default(defaultTheme.background),
      text: hexColor.default(defaultTheme.text),
      accent: hexColor.default(defaultTheme.accent),
      soft: hexColor.default(defaultTheme.soft),
    })
    .default(defaultTheme),
  labels: z
    .object({
      about: z.string().default(defaultLabels.about),
      contact: z.string().default(defaultLabels.contact),
      downloadCv: z.string().default(defaultLabels.downloadCv),
      contactMe: z.string().default(defaultLabels.contactMe),
      letsTalk: z.string().default(defaultLabels.letsTalk),
    })
    .default(defaultLabels),
});

export type Favicon =
  | { kind: 'text'; text: string }
  | { kind: 'file'; href: string; type: string };

export type Profile = z.infer<typeof profileSchema> & {
  dir: 'ltr' | 'rtl';
  aboutParagraphs: string[];
  faviconInfo: Favicon;
};

const FAVICON_TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  ico: 'image/x-icon',
};

// "Alex Morgan" -> "AM", "Alex" -> "A".
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.map((w) => Array.from(w)[0].toUpperCase()).join('');
}

function resolveFavicon(value: string, name: string): Favicon {
  if (value === 'initials') return { kind: 'text', text: initialsOf(name) };

  const ext = /\.([a-z0-9]+)$/i.exec(value.split('?')[0])?.[1]?.toLowerCase();
  if (ext || isUrl(value)) {
    const type = ext ? FAVICON_TYPES[ext] : undefined;
    if (!type) throw new Error(`${PROFILE_FILE}: "favicon" must be a .svg, .png or .ico file (got "${value}").`);
    return { kind: 'file', href: fileHref('favicon', value), type };
  }

  // Count what people see as characters, so an emoji counts as one.
  const graphemes = Array.from(new Intl.Segmenter().segment(value));
  if (graphemes.length > 3) {
    throw new Error(
      `${PROFILE_FILE}: "favicon" text can be at most 3 characters (got "${value}"). Use "initials", a short text, or a file path.`,
    );
  }
  return { kind: 'text', text: value };
}

// "photo.jpg" -> "/photo.jpg" (files/ is served at the site root), after
// checking the file exists. URLs are returned unchanged.
function fileHref(field: string, value: string): string {
  if (isUrl(value)) return value;
  const relative = value.replace(/^\.?\/+/, '');
  if (!existsSync(join(SOURCE.filesDir, relative))) {
    throw new Error(`${PROFILE_FILE}: "${field}" is "${value}", but ${SOURCE.name}/files/${relative} does not exist.`);
  }
  return '/' + relative.split('/').map(encodeURIComponent).join('/');
}

export function loadProfile(): Profile {
  let raw: unknown;
  try {
    raw = parse(readFileSync(SOURCE.profileFile, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${PROFILE_FILE}: ${(err as Error).message}`);
  }

  const result = profileSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`${PROFILE_FILE} has some problems:\n${problems}`);
  }

  const profile = result.data;
  if (profile.photo) profile.photo = fileHref('photo', profile.photo);
  if (profile.cv) profile.cv.file = fileHref('cv.file', profile.cv.file);
  if (profile.titleHighlight && !profile.title.includes(profile.titleHighlight)) {
    throw new Error(`${PROFILE_FILE}: "titleHighlight" ("${profile.titleHighlight}") is not part of "title".`);
  }

  const baseLanguage = profile.language.toLowerCase().split('-')[0];
  return {
    ...profile,
    dir: RTL_LANGUAGES.has(baseLanguage) ? 'rtl' : 'ltr',
    faviconInfo: resolveFavicon(profile.favicon, profile.name),
    aboutParagraphs: profile.about
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}
