# Oxy mock catalogue import — 2026-10-09

The user requested copying all website mocks into `@the-oxy-store` owned by `@oxy`.

- Store: `01a11fb9-e7b2-7d3f-85a3-0c69515d783d`.
- Source: the 12 entries in `src/data/store.ts`: six objects and their two-item packs.
- Payload: [mocks.json](mocks.json). EUR amounts are integer cents. All stock is tracked and zero; descriptions identify preview products.
- Verified public product IDs, prices, images and collection memberships: [result.json](result.json).
- Collections: Wear (4), Carry (2), On your desk (2), Drinkware (4).
- Images use the existing public `https://oxy.so/images/store/*.webp` assets, which Mercaria's media resolver supports directly.
- Mercaria taxonomy currently has no dedicated carry, desk or drinkware categories. Products use the existing broad Home category, T-shirts, or Men; the four manual collections preserve the website's original grouping.

## Execution and checks

The operator used the existing AWS `oxy` administrative profile and the live `oxy-mercaria:66` task definition, reusing its security groups, private subnets and public-IP setting. No security-group or service changes were made. The configured local database tunnel timed out; execution used the documented VPC one-shot mechanism.

The bundled operator source is archived in [operator-source.txt](operator-source.txt); its imports reference the sibling Mercaria checkout and the recorded payload. The executed bundle SHA-256 was `c3bf01cb62c2568de7ee1d57efcb5544e63c13adbac679c4b4bd80e58ed57f9b`. It called the canonical `createStoreProductWithin`, `finishStoreProductCreation` and collection services. Store identity and owner, migrations, image availability and existing handles were checked before writes. All product inserts were in one transaction, guarded by an advisory lock; existing conflicting handles are refused, not overwritten.

A rehearsal created all 12 products and deliberately rolled back. The final task `2ace62ef517a40f3897c49ff8fa6c120` exited 0. Public SDK verification read every product detail and all collection memberships, matching prices, image URLs and out-of-stock availability against the payload. No purchases or payments were made. The temporary private operator bundle was removed after verification.

This is an execution record, not an automated seed or a build step. Production data has already been imported. Do not run the development marketplace seed, which clears unrelated data.

## Collection covers and merch identity — 2026-10-09

Applied the user's follow-up through `updateCollection` and `updateStore`, using the same operator mechanism (task `504ed27593d94e849541e985960e6065`). All four collection covers were previously null. Wear uses the tee, Carry the tote, On your desk the notebook and Drinkware the mug. Memberships were checked before and after. Public SDK and image HTTP verification are recorded in [visuals-result.json](visuals-result.json).

The store logo preserves the paths from `public/logo-mark.svg` inside a shopping bag, using Bloom's generated Oxy palette. Editable SVG and PNG are at `public/images/store/logo.{svg,png}`. Published through the website media library as `6ac8b5ee5a489f3464194d11`; Mercaria uses its public URL.

The website product gallery restores its labelled detail crop when the source has only one photograph. Multiple original photographs remain untouched. Unit checks and a browser check against a real Mercaria product verified the two views, detail label, viewer navigation, zoom and responsive widths.
