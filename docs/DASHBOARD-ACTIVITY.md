# Dashboard world activity

The world consumes `platform_activity` and `platform_infrastructure` from the
central API's `/platform-activity` Socket.IO namespace. Opening the dashboard
subscribes to observations; it does not create ecosystem presence events.

Flow source and destination describe actual movement. `direction` is relative
to the reporting service, while `scope` distinguishes internal/external traffic.
`activityType` selects identity, AI, communication, media or platform colour.
An internal service pair in the same region gets a small schematic loop instead
of disappearing. A return line requires a reported response. Unknown locations
do not produce invented geographic routes.

The client retains the latest observation for each distinct flow for 60 seconds,
with a 512-flow bound. Busy origins cannot evict quieter origins merely by sending
20 repeated updates. Expiry also runs when no new event arrives. Edge geometry
comes from Cloudflare's PoP inventory. PoP location is not the visitor's IP-derived
country, so a VPN country and its ingress PoP need not coincide. The shared browser
telemetry package refreshes its PoP discovery after 15 seconds of subsequent use.

Infrastructure snapshots replace the inventory, including empty snapshots.
New regions carry their own infrastructure coordinates. Old snapshots cannot
restore removed regions. Disconnect marks known nodes unknown until the next
snapshot; the initial Oregon seed is also unconfirmed. `/api/infra-status`
proxies the same central inventory and returns an error on upstream failure.
There are no synthetic healthy infrastructure counts.

## Rollout dependency

This branch depends on the paired OxyHQServices change adding the shared
collector, authenticated ingestion and heartbeat registry. The API registers
itself. Registry updates broadcast on registration/removal, and refresh every
10 seconds; crashed instances expire after 45 seconds at the next refresh.
This inventory describes reporting service instances, not an automatic census
of every cloud database, cache, bucket or CDN resource.

**Whole-ecosystem coverage is not deployed.** The following work remains before
claiming that every product's traffic appears:

1. Publish the updated telemetry/core packages through the established release
   flow and deploy the central API with its shared Redis/socket adapter.
2. Install `createEcosystemTraffic` in each HTTP service using its existing
   trusted service credential. Mount its middleware before routes, wrap outbound
   fetch once, report readiness and call `stop` during graceful shutdown.
3. Add corresponding producers for Kaana's Go transports, static web/edge requests,
   queues, socket messages and other non-fetch transports. Those paths are not
   covered by an Express middleware or a global fetch wrapper.
4. Verify each producer with real ingress/egress, an internal call, a media call,
   a region change and shutdown. Confirm the running image after deployment.

Current local verification covers the collector contract, not installation in
Mention, Mercaria, Alia, Kaana or the website backend. Request observations are
best effort aggregates, not durable or deduplicated billing totals. A hop seen
by both reporting services can produce observations from both perspectives.

## Verification

```sh
bun test scripts/platform-activity.test.ts scripts/infrastructure-status.test.ts scripts/activity-motion.test.ts
bunx tsc -b
bunx vite build
# In another terminal: bun run dev:client --host 127.0.0.1
bun scripts/platform-activity.browser.test.ts
```

The browser fixture checks actual 2D flow groups, movement directions, media
classification, internal loops, React console errors and 3D rendering. It writes
screenshots under `/tmp/oxy-activity-*.png`. SDK tests additionally cover changing
PoPs, malformed aggregates, infrastructure expiry and real socket reconnects.
