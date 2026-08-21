CREATE TABLE "memory_game_runs" (
	"_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"score" integer NOT NULL,
	"level" integer NOT NULL,
	"moves" integer NOT NULL,
	"pairs_found" integer NOT NULL,
	"cleared_all" boolean DEFAULT false NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "memory_game_runs_user_idx" ON "memory_game_runs" USING btree ("user_id","_id");