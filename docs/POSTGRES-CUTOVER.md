# Mongo → Postgres cutover

**Done on 2026-08-07.** `website-api` serves from Postgres — database `website`
on `oxy-postgres`, owned by its own role, task definition `oxy-website-api:4`.

**The `oxy-website` Mongo database was archived and dropped on 2026-08-09**, so
Postgres is now the sole authority for every byte this service owns, and there
is no longer a rollback to Mongo (see "Rolling back" below). This file is kept
as the record of what was done, because the next Oxy app to make the same move
will hit the same four things.

## What was done

1. **Provisioned** per `~/Oxy/oxy-infra/docs/runbooks/30-postgres-database-provisioning.md`:
   role `website`, database `website` owned by that role (`pg_get_userbyid(datdba)`
   verified, not assumed). `oxy-postgres` is `publicly_accessible = false`, so
   this ran as a one-off ECS task in the tasks security group, with the master
   credential injected from SSM as a container secret — never through a shell.
   No PostGIS: nothing in this schema uses a geography type.
2. **`DATABASE_URL`** written to `/oxy/website-api/DATABASE_URL` and to the repo
   secrets, then added to the task definition in Terraform
   (`oxy-infra` `terraform-uswest2/app-services.tf`, applied targeted). The repo
   secret alone is not enough: `deploy-aws.yml` syncs it to SSM, but a running
   task reads what its task definition declares.
3. **Copied** with the **Copy Mongo to Postgres** workflow — a one-off ECS task
   running `bun server/db/copyFromMongo.ts`, because neither database is
   reachable from a laptop or a GitHub runner. 64 media, 47 newsroom posts, 22
   jobs, 23 tracked repos, 20 translations and the rest, verified by reading the
   row counts back out of Postgres.
4. **Cut over** by pointing the service at the revision carrying `DATABASE_URL`.

## What it cost, and what to expect next time

- **The service will not start without the value.** `server/db/postgres.ts`
  throws rather than falling back to a host. The first Postgres image was
  deployed before step 2, every task died at boot, and the circuit breaker
  rolled back to the Mongo image — which is the safe outcome, but the deploy job
  reported **success** while it happened (`ecs wait services-stable` is true of a
  rolled-back service too).
- **`CREATE DATABASE … OWNER` needs a grant.** PostgreSQL 16 requires the
  creating role to be able to `SET ROLE` to the owner it names, and `oxyadmin` is
  rds_superuser, not a superuser. Runbook 30 now carries the step.
- **Data Mongo used to hide comes through.** Five newsroom covers hold an
  absolute URL where a media id belongs, and every job description is text where
  the Mongoose schema declared blocks. Mongo served `null` and `[]`; Postgres
  serves the value. The copier resolves foreign-key columns for that reason —
  an id-shaped value goes through, anything else is copied as null and named in
  the log.
- **Ordering is not free.** Mongo broke ties by insertion order; Postgres returns
  heap order. Every list query now ends on `_id`. The one exception is a
  `SELECT DISTINCT`, which rejects an ORDER BY outside its select list.
- **Diff the endpoints, don't trust the boot.** Every public GET was captured
  before the cutover and compared after. That is what caught `/api/newsroom`
  500ing on an array bound into a raw fragment, and `/api/changelog` 500ing on
  the DISTINCT above. What remains is `__v` disappearing, columns Mongo omitted
  now appearing as explicit nulls, and job descriptions rendering.

## Rolling back

**There is no rollback to Mongo.** The `oxy-website` database was dropped on
2026-08-09. Until then the way back was a task definition carrying `MONGO_URI`
and the pre-cutover image digest
`oxy/website-api@sha256:e93b0917f405c1b52c18078771838ede38e9a0d224bb061e8d3f2f0691f89e72`;
that image still exists, but the database it reads does not, so deploying it
now yields a service that boots and serves nothing.

The only remaining copy of the pre-cutover data is the verified archive
`s3://oxy-mongo-backups-usw2-237343248947/operations/oxy-website-final-2026-08-09.archive.gz`
(sha256 `a5b8ec28afff7305f334bb2d23621b92af4116c9620c60eb542338c45d96a97d`, 29
collections, 209 documents, restore-tested). Recovering from it means standing
up a Mongo instance and restoring into it first — an incident response, not a
rollback.

Forward recovery is Postgres's own: `oxy-postgres` automated backups and
point-in-time restore, per `~/Oxy/oxy-infra`.

## Retired

- `server/db/copyFromMongo.ts`, the `db:copy` script and the **Copy Mongo to
  Postgres** workflow — removed 2026-08-09; there is nothing left to copy from.
- The `mongodb` dependency (pinned to 6) and `server/package.json`'s `mongoose`,
  which no file ever imported.
- The `oxy-website` database itself, archived and dropped 2026-08-09.

Still to retire, and owned by `oxy-infra` rather than this repo: `MONGO_URI` on
the task definition and the `/oxy/website-api/MONGO_URI` SSM parameter. Nothing
in this image reads either one — the copier was their only consumer — so they
are inert, but they must come out through Terraform, because an undeclared
secret left in place is how a targeted apply silently drops one.
