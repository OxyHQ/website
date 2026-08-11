-- The hero's background footage was replaced, and the old files are gone. A
-- stored row still naming them is a 404 behind the panel rather than an error,
-- so the rows move with the files. Rows an editor has since pointed elsewhere
-- are left alone.
UPDATE "hero_contents"
SET "background_video_webm" = '/images/landing/hero-panel.webm'
WHERE "background_video_webm" = '/images/landing/hero-background.webm';

UPDATE "hero_contents"
SET "background_video_mp4" = '/images/landing/hero-panel.mp4'
WHERE "background_video_mp4" = '/images/landing/hero-background.mp4';
