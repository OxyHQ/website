# Mongo → Postgres cutover

What is already done, and the four steps that remain. The code on `main` talks
to Postgres only; production still holds its data in Mongo, so nothing changes
for visitors until step 4.

## Done

- Schema, migrations and the whole API ported to Drizzle + `postgres.js`.
- `server/db/copyFromMongo.ts` copies a Mongo database into Postgres, keyed on
  `_id`, idempotent and re-runnable, never deleting.
- Verified locally against a real Postgres: seed, boot, every public endpoint
  200, and the site rendering from it (`/`, `/company`, `/company/careers`,
  `/technologies`, `/newsroom`, `/status`, `/pricing`, `/help`, `/apps`).

## 1. Provision the database

`oxy-postgres` is inside the VPC (`postgres.internal.oxy.so:5432`,
`publicly_accessible = false`), so this runs from a host that can reach it, with
the master user. Follow `~/Oxy/oxy-infra/docs/runbooks/30-postgres-database-provisioning.md`
verbatim — it is the ecosystem-level authority for this, and it puts the
application role, not `oxyadmin`, in charge of the database.

Two things that runbook flags and that apply here:

- **The website is the third tenant** on a single-AZ instance already
  authoritative for two production applications. Read
  `docs/postgres-shared-instance-capacity.md` before adding it.
- No PostGIS is needed: nothing in this schema uses a geography type.

## 2. Point the service at it

`DATABASE_URL` as a **repo secret**. `deploy-aws.yml` syncs every repo secret to
`/oxy/oxy-website/<NAME>` on each run, so no workflow edit is needed — but the
running ECS task definition does not inherit it. Per the same runbook, adding
the secret to Terraform is not the last hop: register a task definition
revision that carries `DATABASE_URL` and point the service at it, then confirm
with `aws ecs describe-task-definition`, not with the `.tf` file.

`MONGO_URI` can come out at the same time; nothing reads it any more.

## 3. Copy the data

Run the **Copy Mongo to Postgres** workflow (Actions → run → type `copy`).

It does not copy anything on the runner: neither database is reachable from
outside the VPC, so it starts a one-off ECS task on the same task definition,
subnets and security group the API service is running, overriding the command
to `bun server/db/copyFromMongo.ts`. That task can see both. The workflow then
prints the task's log — per-collection read/written counts, then the row counts
read back out of Postgres — and fails if the task exited non-zero or if any
table came out short of what was written.

It refuses to start unless the task definition carries **both** `MONGO_URI` and
`DATABASE_URL`, so running it before step 2 tells you that rather than copying
half of nothing.

Run it twice: once days before, to prove it works and to see how long it takes;
once during the window, to catch everything edited since. That is safe because
the copy writes by `_id` and never deletes — verified against a real Mongo:
a renamed document updates in place on the second pass, and a document deleted
in Mongo stays in Postgres.

Locally, against your own pair of databases, the same script is:

```bash
MONGO_URI='<mongo>' DATABASE_URL='<postgres>' bun run db:copy
```

## 4. Cut over

Deploy, watch `/api/ready` (it runs `select 1` against the pool rather than
reporting a cached connection flag), and spot-check a page that reads the CMS —
`/technologies` exercises products, categories and media in one request.

Roll back by pointing the task definition at the previous revision: the Mongo
database is untouched by all of the above.
