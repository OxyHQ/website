CREATE TABLE "lock_test_runs" ("id" serial PRIMARY KEY, "applied_by" integer NOT NULL DEFAULT pg_backend_pid());
