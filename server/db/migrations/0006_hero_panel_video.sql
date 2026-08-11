-- The hero's background footage was replaced, so the stored rows move with the
-- files. These columns are jsonb, not text: a media reference can be an object,
-- and a static path is stored as a JSON string. `#>> '{}'` reads the scalar out
-- of one and returns NULL for the other, so an object reference never matches
-- and is left alone, and so is any row an editor has since pointed elsewhere.
UPDATE "hero_contents"
SET "background_video_webm" = to_jsonb('/images/landing/hero-panel.webm'::text)
WHERE "background_video_webm" #>> '{}' = '/images/landing/hero-background.webm';

UPDATE "hero_contents"
SET "background_video_mp4" = to_jsonb('/images/landing/hero-panel.mp4'::text)
WHERE "background_video_mp4" #>> '{}' = '/images/landing/hero-background.mp4';
