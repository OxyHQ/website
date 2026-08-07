# Mongo → Postgres cutover

**Done on 2026-08-07.** `website-api` serves from Postgres — database `website`
on `oxy-postgres`, owned by its own role, task definition `oxy-website-api:4`.
The Mongo database is untouched and still holds a copy of everything.

This file is kept as the record of what was done, because the next Oxy app to
make the same move will hit the same four things, and because the rollback below
is only true while the Mongo copy is still there.

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

While the Mongo database exists, the way back is a task definition carrying
`MONGO_URI` and the last Mongo image — `oxy/website-api@sha256:e93b0917f405c1b52c18078771838ede38e9a0d224bb061e8d3f2f0691f89e72`,
the digest the service was running before the cutover. `:latest` is not a
rollback: it has pointed at Postgres code since 2026-08-07.

## Still to retire

- `MONGO_URI` on the task definition, and the `mongodb` dependency pinned to 6
  (driver 7 pulls a `bson` that calls `v8.startupSnapshot.isBuildingSnapshot()`
  at import, which Bun does not implement). Both exist only for the copy.
- The `oxy-website` database on the Mongo instance, once the copy has proven
  itself for long enough to be worth deleting.

Locally, against your own pair of databases, the copy is:

```bash
MONGO_URI='<mongo>' DATABASE_URL='<postgres>' bun run db:copy
```
