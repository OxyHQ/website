-- The homepage can be rendered entirely from its checked-in content, but the
-- CMS hook still reads this row for optional section overrides. Older
-- databases predate that document, which made every visit emit a 404 and left
-- the admin editor unable to create it. Keep existing editorial content
-- untouched and create only the missing shell.
INSERT INTO "pages" ("_id", "slug", "title", "description", "sections", "prompt_phrases")
VALUES (
  '68c0e8da4c9f71a2b305d614',
  'home',
  'Oxy',
  '',
  '[]'::jsonb,
  ARRAY[]::text[]
)
ON CONFLICT ("slug") DO NOTHING;
