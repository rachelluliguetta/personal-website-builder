# personal-website-builder

A clean, one-page personal website for developers, generated from a single `profile.yaml` file.
No design work needed: fill in your details, add your photo and CV, and publish.

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com). The output is a static site you can host for free.

## What you get

- An intro with your round photo, title, a one-line pitch, an optional "available" badge and your skills
- An "About me" section
- Contact cards for email, LinkedIn and GitHub, each optional (with none, the contact section and buttons are hidden)
- A "Download CV" button for your PDF
- A favicon made from your initials and colors, or your own icon file
- A four-color theme you set in `profile.yaml`, with a dark mode derived from it automatically
- Right-to-left layout for Hebrew, Arabic, Persian and Urdu
- Clear error messages if something in `profile.yaml` is wrong or a file is missing

## Quick start

You need [Node.js](https://nodejs.org) 22.23 or newer (24 recommended).

```bash
git clone <your-copy-of-this-repo> my-website
cd my-website
npm install
npm run dev
```

Open http://localhost:4321 to see the example site.

## Make it yours

Everything about you lives in one folder, `my-profile/`:

```
my-profile/
  profile.yaml      your text, links and colors
  files/
    photo.jpg       your photo (any name, set it in profile.yaml)
    cv.pdf          your CV
    icon.png        optional, your own favicon
```

1. Copy the example: `cp -r example-profile my-profile`
2. Put your photo and CV in `my-profile/files/` and delete the example ones.
3. Edit `my-profile/profile.yaml`: name, title, about text, contacts, and the file names of your photo and CV.
4. Pick your four colors under `theme` (background, text, accent, soft).
5. Optionally set `favicon`: your initials (default), a short text or emoji, or your own icon file.
6. Run `npm run dev` and check the result.

Every field is documented inside `profile.yaml`. Delete a contact line to hide it.

When `my-profile/` exists the site is built from it; otherwise you see the example.
The folder is picked when the dev server starts: restart `npm run dev` after creating or deleting `my-profile/`.
Only the content of `files/` is published: `profile.yaml` itself never goes online.

`my-profile/` is git-ignored, so your personal data never ends up in a commit by accident.
That is what you want while working on the template. To publish your own site from a
repository, see [Publish](#publish).

### Another language

Set `language` (for example `fr` or `he`) and translate the section titles under `labels`.
For `he`, `ar`, `fa` and `ur` the whole layout switches to right-to-left.

## Publish

Set `siteUrl` in your profile to the address of your site first: link previews on LinkedIn,
WhatsApp and Slack need it to show your photo.

```bash
npm run build
```

This creates a static site in `dist/`. Upload it to any static host, for example
[Vercel](https://vercel.com), [Netlify](https://www.netlify.com), [Cloudflare Pages](https://pages.cloudflare.com)
or [GitHub Pages](https://pages.github.com).

If your host builds the site from a Git repository, it needs your `my-profile/` folder.
Use a separate repository for your own site (ideally private), and in that copy remove the
`my-profile/` line from `.gitignore`. Never do this in a public repository.

## Project structure

```
my-profile/                  Your profile (git-ignored, you create it)
example-profile/             The example profile, used when my-profile/ does not exist
src/lib/profile-source.mjs   Picks which profile folder to use
src/lib/profile.ts           Reads and checks profile.yaml
src/pages/index.astro        The page
src/pages/favicon.svg.ts     Generates the favicon
src/components/              Small building blocks (icons)
src/styles/global.css        Fonts and theme colors
```

## Privacy note

Your copy of this project will contain your photo, CV and contact details.
If you keep your copy on GitHub, think about whether the repository should be private.
Never commit `.env` files or API keys.

## License

[MIT](LICENSE)
