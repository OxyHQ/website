-- Idempotency records for MCP writes (issue #108, F07).
--
-- Hand-written for the same reason as 0020. A write called with an
-- idempotency key commits its own changes and this row in one transaction, so
-- the row exists exactly when the write happened; retries on any task replay
-- it. Rows expire after 24 hours and are swept.
CREATE TABLE IF NOT EXISTS "mcp_idempotency_keys" (
  "_id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "tool" text NOT NULL,
  "key_hash" text NOT NULL,
  "request_hash" text NOT NULL,
  "result" jsonb NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mcp_idempotency_keys_scope_idx" ON "mcp_idempotency_keys" USING btree ("account_id","tool","key_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_idempotency_keys_expires_idx" ON "mcp_idempotency_keys" USING btree ("expires_at");
