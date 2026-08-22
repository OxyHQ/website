# Newsroom article-components showcase

The authoring fixture lives at
`src/content/newsroom-previews/article-components-showcase.md.txt`. The `.txt`
suffix keeps Vite's MDX transform from compiling the authoring source before
the development-only raw loader reads it. The file still contains ordinary
Markdown and exercises
every typed Newsroom fence and the inline citation syntax using only statements
that can be checked against the renderer's schemas and behavior.

## Local preview

1. Run `bun run dev`.
2. Open
   `http://localhost:5173/newsroom/article-components-showcase-preview`.
3. Check desktop and mobile, light and dark themes, keyboard navigation in the
   tabs, carousel controls, table scrolling, and citation return links.

`useNewsroomPost` recognizes that reserved slug only when
`import.meta.env.DEV` is true. The fixture is loaded through a dynamic import,
so a production build eliminates the branch and the Markdown. It is not a
database row and cannot enter Newsroom lists, sitemap enumeration, or
prerendering.

## Publish after the renderer deploys

Do not publish this Markdown before the typed-fence renderer is deployed. An
older frontend presents the fence payloads as code blocks.

After deployment:

1. In Admin → Newsroom, create a draft with the metadata from
   `article-components-showcase.ts`.
2. Paste the Markdown fixture into the post's `content` field unchanged.
3. Keep `status` as `draft` while checking the content and its attributions.
4. Change the slug and editorial copy if the showcase is becoming a public
   story rather than a component demonstration.
5. Publish only after the deployed article renderer has been verified with the
   same fences.

The public API hides drafts. Administrators can retrieve a draft detail with
the existing authenticated `?preview=true` API behavior; no production-only
preview bypass is introduced by this fixture.
