-- The careers page reads Oxy's open roles from Clarity Jobs. They are written
-- in Mention and indexed by Clarity, so this site keeps no copy: the table goes,
-- with every translation overlay that pointed into it.
DELETE FROM "translations" WHERE "collection_name" = 'jobs';
--> statement-breakpoint
DROP TABLE IF EXISTS "jobs";
