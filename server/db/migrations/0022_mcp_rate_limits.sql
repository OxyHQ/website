-- Per-account MCP usage per minute, shared by every task (issue #108).
-- Hand-written, like 0020 and 0021: a plain addition.
CREATE TABLE IF NOT EXISTS "mcp_rate_limits" (
  "account_id" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "cost" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mcp_rate_limits_account_window_idx" ON "mcp_rate_limits" USING btree ("account_id","window_start");
