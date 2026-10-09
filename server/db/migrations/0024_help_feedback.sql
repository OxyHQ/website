-- Existing hand-written migrations 0017–0023 already applied the other snapshot differences.
CREATE TABLE "help_feedback" (
	"_id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"locale" text NOT NULL,
	"token" text NOT NULL,
	"helpful" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "help_feedback_article_token_idx" ON "help_feedback" USING btree ("slug","locale","token");
