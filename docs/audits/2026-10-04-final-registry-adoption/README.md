# website: published SDK adoption

Source `ce8a96ef04cc7c7c28faca379d3529d0ae360c9b` pins the published SDK and its measured compatible Bloom version, including the regenerated lockfile. Existing application behavior and previously reviewed fixes remain in the branch.

Validation: {"sdkImporterMembers": 3238, "bloomImporterMembers": 21941, "canonicalBuild": "passed", "bloomDemos": 17, "kaanaBrandTests": 3, "browserThemeDocsLanding": "passed"}. Exact commands, logs, archive member hashes and importer resolutions are in [proof.json](proof.json).

- Published registry archives and installed members were compared byte for byte. Same-version stale candidate materializations and the first failing frozen/setup runs remain recorded.
- Fresh main 07c01d7 was merged without dropping its Bloom landing/demos. Its expanded image exclusion caused an obsolete literal-string test failure; the test now checks actual Kaana exclusion behavior while preserving canonical SVG byte checks. Runtime image processing was not changed.
- Full canonical build included tsc -b, Vite, prerender, Pagefind, routing/CSP checks and browser theme/docs/17-demo/landing checks. This is local website behavior, not deployed authentication acceptance.
- Generated changelog and synced-doc index refreshes were retained privately and restored to the source baseline after build; generated Bloom catalog version/props changes are included.
- No production database, provider writes, grants, credentials or auth fixtures were changed. Required CI and root promotion remain separate.
