# `_unused/` — quarantined cloned assets

This directory contains image assets that were imported into the project from
other websites during early development (the Oxy website was scaffolded by
cloning marketing pages from Attio, The Browser Company's Astro/Dia, OpenAI
Codex, a Sana-like AI agents launch page, and similar references).

Each file in here is **not currently referenced from anywhere in `src/`** —
they were left over after the cleanup pass that removed the cloned testimonial
strips, partner logo walls, and feature-section imagery.

## Why we kept them instead of deleting

- Some may be re-used later if we re-introduce the section that referenced
  them (after replacing the surrounding content with Oxy-original copy).
- They are not in production deploys (the live site only ships the assets
  actually referenced by the bundle), but `public/` is still served as static
  files, so we removed these from the served paths to avoid accidental
  hot-linking.

## What's in here

```
_unused/landing/   — Partner/integration logos cloned from a previous
                      "trusted by" wall (Strava, Robinhood, Merck, Polestar,
                      Apollo.io, Google Workspace, Salesforce, Jira, Slack,
                      ServiceNow, Workday, etc.) and an opaque Figma export
                      (4lffisf...avif). Plus a few unused agents-* / video-
                      thumb-* clones from the original Sana AI-style page.

_unused/astro/      — Reserved (nothing here yet; Astro browser assets are
                      still actively used by /astro until we replace them).

_unused/oxyos/     — `hero.png` (orphan; OxyOSPage uses os-desktop.jpg).

../_unused/ai/     — `meeting.mp4`, `morning-briefing.png`, `sun-halo.png`
                     (orphan AI-launch clone artifacts).

../_unused/docs/   — All 8 cloned docs hero illustrations (cli/components/
                     editor/rocket × light/dark) from the original cloned
                     docs landing — DocsIntroPage no longer references them.
```

## How to "rescue" a file

If you find you need one of these:

1. `git mv` it back to its original location under `public/`.
2. Re-reference it in `src/`.
3. Verify the surface that re-uses it is on-brand for Oxy.

## How to permanently delete

These can be deleted any time the team is confident they won't be needed.
A single `git rm -r public/images/_unused public/_unused` is safe.
