ALTER TABLE "jobs" ADD COLUMN "valid_through" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "address" jsonb DEFAULT '{}'::jsonb NOT NULL;