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

Twice. Once days before, to prove it works and to see how long it takes; once
during the window, to catch everything edited since.

```bash
MONGODB_URI='<production mongo>' DATABASE_URL='<new postgres>' bun run db:copy
```

It prints per-collection read/written counts and then verifies by reading row
counts back out of Postgres. A non-zero exit means at least one collection
failed; nothing is deleted either way, so a failed run is safe to repeat.

## 4. Cut over

Deploy, watch `/api/ready` (it runs `select 1` against the pool rather than
reporting a cached connection flag), and spot-check a page that reads the CMS —
`/technologies` exercises products, categories and media in one request.

Roll back by pointing the task definition at the previous revision: the Mongo
database is untouched by all of the above.
