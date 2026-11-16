import type { APIRoute } from 'astro';
import { loadProfile } from '../lib/profile';

// Builds /favicon.svg from profile.yaml: the favicon text (your initials by
// default) on a rounded square in your accent color.
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const profile = loadProfile();
  const { faviconInfo, theme } = profile;
  const text = faviconInfo.kind === 'text' ? faviconInfo.text : '';

  const length = Array.from(new Intl.Segmenter().segment(text)).length;
  const fontSize = length <= 1 ? 62 : length === 2 ? 48 : 36;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="${theme.accent}"/>
  <text x="50" y="50" dy="0.35em" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${theme.background}">${escapeXml(text)}</text>
</svg>
`;

  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
