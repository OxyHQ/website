# App screenshots

The October 30, 2026 refresh uses captures of the deployed apps in Windows Chrome.
Reviewed screenshots live in `public/images/screenshots/`; Commons uses smaller
WebP versions. Marketing images keep the existing photographic device mockups in
`public/images/landing/`, replacing only the content of their displays.

| App | Production source | View and mockup |
| --- | --- | --- |
| Mention | https://mention.earth/@mention | Public product profile and Deck announcement inside the original blue-lit laptop |
| Alia | https://alia.onl/ | Conversation start screen inside the original purple-lit laptop |
| Inbox | https://inbox.oxy.so/ | Signed-in message list with example content inside the original blue phone |
| Homiio | https://homiio.com/ | Public home search and city discovery inside the original phone on warm stone |
| Mercaria | https://mercaria.co/ | Public search and shopping categories on the original monitor and phone |

Inbox was captured using an existing signed-in session. Senders, subjects and
previews were replaced with example messages in the capture tab's DOM. Its
mail-derived AI summary and suggestions were omitted. This does not change the
mailbox, send messages, or create production records. The app listing identifies
the example messages. Never commit browser profiles, cookies, session state, or
unsanitized mailbox captures.

The same source screenshots appear in app listings and, for Mention, the brand
guide. Landing cards also supply existing link previews and help/search thumbnails.
Homiio and Mercaria now have app-listing galleries as well.

## Refresh

1. Open the production app in Windows Chrome. Use a dedicated capture tab and
   an existing session only where necessary. Leave original tabs, account
   preferences and saved layouts intact.
2. Choose a complete, representative view. Match the viewport to the device in
   the existing mockup: desktop for computers and mobile for phones. Wait for
   fonts and visible images; reject skeletons, failed requests and stale-cache
   notices. Sanitize private content locally before saving.
3. Keep the reviewed raw capture separate from the photographic composite.
   Save raw screenshots as `<app>-app.png`, with a mobile source where needed.
   Derive the Commons WebPs from these raw sources.
4. Edit the existing marketing photograph using the prompt below. Inspect the
   result against both inputs, checking device edges, screen perspective,
   typography, reflections and the untouched scene. Keep the original canvas
   dimensions and filenames. Never replace the photograph with a new flat frame.
5. Increment the `?v=` revision on every reference to a replaced image. The
   public image cache lasts 30 days; clearing the CDN does not clear visitors'
   browser caches. Keep card and Open Graph references on the same revision.
6. Review the app listings, cards, Commons and brand guide at desktop and mobile
   widths. Confirm images load and there is no horizontal overflow. Run
   `bunx tsc -b` and the production frontend build.

## Editing prompt set

These composites use the built-in image editing tool. Each edit has the existing
photograph as its first input and the relevant current screenshots as subsequent
inputs (Mercaria has separate desktop and mobile screenshots).

Shared prompt:

> Use case: compositing, precise screen replacement. Image 1 is the edit target.
> Change only the active display pixels inside the existing device bezel, using
> the supplied current production screenshot. Preserve the original camera
> angle, device silhouette, placement, size, metal edges, buttons, stone props,
> background, lighting, shadows and framing. Map the screenshot to the display
> using its projective perspective and rounded clipping. Preserve the genuine
> screenshot layout, text, icons, colours and navigation; do not invent interface
> elements or content. Retain the original subtle glass reflections. The result
> is the same photographic mockup with an updated screen, not a new device or
> composition. Keep the original canvas dimensions.

Per-image constraints:

- **Mention:** preserve the blue laptop, keyboard, trackpad and blue stone scene;
  replace only its screen with the public Mention profile capture.
- **Alia:** preserve the dark laptop and purple-lit stone scene; replace only its
  display with the current conversation entry screen.
- **Inbox:** preserve the blue metal phone and blue stone blocks; fit the mobile
  message list to its display, retaining the top and bottom navigation.
- **Homiio:** preserve the angled phone, warm stone blocks, camera cutout and
  lighting; use the mobile search/discovery capture.
- **Mercaria:** preserve both devices and the blue-lit scene; use the desktop
  screenshot on the monitor and the mobile screenshot on the phone.

Unused scene illustrations and native-app imagery are outside this refresh.
