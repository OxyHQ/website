# Platform activity

The world map consumes the central API's public aggregate stream and live
infrastructure snapshots. Opening the dashboard does not start collection.

The website API installs the shared `@oxy.so/core/server` publisher once during
boot when `OXY_ECOSYSTEM_ACTIVITY_ENABLED=true`. Set `AWS_REGION` and the
server-only `OXY_SERVICE_API_KEY` / `OXY_SERVICE_API_SECRET` pair before enabling
it. Missing enabled configuration fails before the listener starts. Leave the
flag false in local environments. Infrastructure readiness follows database
bootstrap, and graceful shutdown removes the instance registration.

The publisher observes incoming HTTP requests, actual outgoing responses, and
outbound fetch/Node HTTP calls. It sends bounded category/count aggregates, not
raw URLs, payloads, account identifiers or IP addresses. Browser metadata uses
Cloudflare's ingress PoP, refreshed after network changes; this is not a claim
about the visitor's physical location or VPN exit country. Raw media uploads
use the same browser metadata as the linked API client.

Delivery is best effort. Both ends of a service hop may report observations;
the counters are operation observations, not deduplicated billing totals or
packet/byte counts. Direct object-storage/media transport and database wire
traffic are not observed by this HTTP publisher. Static CDN requests use the Pages middleware separately.

## CDN activity

Pages middleware observes documents and static assets using the shared
`@oxy.so/telemetry/edge` helper. `public/_routes.json` includes every route so
assets do not bypass observation. Each request consequently invokes a Pages
Function. The original response body, streaming behavior and cache headers are
preserved; publication runs through `waitUntil` with a bounded timeout.

Enable only on production with `OXY_EDGE_ACTIVITY_ENABLED=true` and the
server-side `OXY_EDGE_ACTIVITY_API_KEY` / `OXY_EDGE_ACTIVITY_API_SECRET` pair.
The optional `OXY_EDGE_ACTIVITY_API_URL` must be an HTTPS origin. These are
runtime bindings, never `VITE_*` variables. Provision them using the reviewed
infrastructure workflow; do not copy backend credentials into browser builds.

The edge publisher reports the serving PoP from `request.cf.colo`. Unknown
visitor endpoints remain unknown: a CDN operation produces an activity pulse
at its known PoP, not an invented line to a visitor country. Collection-control
requests are excluded to prevent self-generated activity.

## Dashboard URL controls

- `fullscreen=true`: fill the viewport, with a fallback when browser fullscreen
  permission requires an interactive gesture.
- `fullscreenLayout=false`: keep the normal layout and widget scale on a TV.
- `widgetRows=1` or `widgetRows=2`: choose one or both widget rows independently.
- `hideControls=true`: hide the 2D/3D switch and fullscreen button. Escape exits
  fullscreen while preserving the other options.

Example: `/dashboard/?fullscreen=true&fullscreenLayout=false&widgetRows=2&hideControls=true`.
