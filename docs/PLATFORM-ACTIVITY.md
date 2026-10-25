# Platform activity

The world map consumes the central API's public aggregate stream and live
infrastructure snapshots. Opening the dashboard does not start collection.

The website API installs the shared `@oxy.so/core/server` publisher once during
boot with the registered website workload and temporary AWS credentials. ECS
provides the task role; local development uses a registered IAM SSO/assume-role
identity through the shared credential provider. No customer key or ECS-only
environment check controls collection. Configure `AWS_REGION` for the instance.
Infrastructure readiness follows database bootstrap, and graceful shutdown
removes the instance registration.

The publisher observes incoming HTTP requests, actual outgoing responses, and
outbound fetch/Node HTTP calls. It sends bounded category/count aggregates, not
raw URLs, payloads, account identifiers or IP addresses. Browser metadata uses
Cloudflare's ingress PoP, refreshed after network changes; this is not a claim
about the visitor's physical location or VPN exit country. Raw media uploads
use the same browser metadata as the linked API client.

Delivery is best effort. Both ends of a service hop may report observations;
the counters are operation observations, not deduplicated billing totals or
packet/byte counts. Direct object-storage/media transport and database wire
traffic are not observed by this HTTP publisher. Static CDN requests are
measured separately (below).

## CDN activity

The static site's web traffic is measured keylessly by Oxy from Cloudflare's own
analytics (see OxyHQ/oxy `docs/operations/cloudflare-web-activity.md`). The
Pages project holds no Oxy activity secret and `functions/_middleware.ts` runs
no activity code. The `OXY_EDGE_ACTIVITY_*` bindings were never provisioned and
nothing reads them now; if an operator ever finds one on the Pages project it
can simply be deleted.

## Dashboard URL controls

- `fullscreen=true`: fill the viewport, with a fallback when browser fullscreen
  permission requires an interactive gesture.
- `fullscreenLayout=false`: keep the normal layout and widget scale on a TV.
- `widgetRows=1` or `widgetRows=2`: choose one or both widget rows independently.
- `hideControls=true`: hide the 2D/3D switch and fullscreen button. Escape exits
  fullscreen while preserving the other options.

Example: `/dashboard/?fullscreen=true&fullscreenLayout=false&widgetRows=2&hideControls=true`.
