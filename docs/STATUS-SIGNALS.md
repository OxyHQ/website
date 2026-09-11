# Public status signals

The status API probes every product explicitly enabled for the public board.
HTTP is only reachability. Services with a functional alarm must also have that
alarm in `OK`; a missing alarm, an unreadable CloudWatch response or
`INSUFFICIENT_DATA` becomes `unknown`, never operational.

| Service | Reachability | Functional signal | Dependencies |
| --- | --- | --- | --- |
| Alia | `GET https://api.alia.onl/health/ready` (process + PostgreSQL readiness) | `oxy-alia-functional-failures`: repeated passive capability-loading or Kaana inference failures in two of three five-minute periods | Oxy API and Kaana |
| Kaana | `GET https://kaana.ai/livez` | `oxy-kaana-routing-readiness-not-confirmed`: the existing free, scheduled routing-score and catalogue proof | none |
| Allo | `GET https://api.allo.you/api/health` | Backend health contract | Oxy API |
| Clarity | `GET https://api.clarity.surf/health/ready` | PostgreSQL and attested-cutover readiness | Oxy API and Kaana |
| CrowdSource | `GET https://api.crowdsource.oxy.so/health/ready` | Runtime and PostgreSQL readiness | Oxy API |
| Nilo | `GET https://api.nilo.so/health/ready` | PostgreSQL readiness | Oxy API |
| Noted | `GET https://api.noted.oxy.so/health/ready` | Database and migration readiness | Oxy API |
| Moovo | `GET https://api.moovo.now/health/ready` | Store readiness | Oxy API |
| Mercaria | `GET https://api.mercaria.co/health/ready` | Database and migration readiness | Oxy API |
| FairCoin bridge / buy / explorer | Their dedicated `/health`, `/health/buy`, or mining-info API endpoint | Public backend contract | none declared |
| Oxy API / Website API | Their dedicated health endpoint | Public backend contract | none declared |
| Every other public board entry | No probe | `unknown` until the owner publishes and documents a non-billable authoritative signal | Declared dependencies may still worsen it to `down` |

The status backend reads only the two exact CloudWatch metric alarms through its
ECS task role. It does not read application logs, provider names, model names,
credentials or alarm reasons. It never sends an inference request. An Alia
dependency can only worsen Alia's state; a green landing page cannot mask a
failed inference data plane or authorization path.

Landing pages and app shells are display destinations only. The backend never
falls back from a missing probe to `href`, and only the audited exact endpoint
map in `functionalStatus.ts` may produce an HTTP-derived state. A CMS URL alone
cannot opt a product into green status.

Every app with a public Oxy surface or public backend is enabled on the board,
including Nilo and the other products still labelled `in-development`; their
status describes current reachability, not product maturity. Worker-only and
private MCP/ECS components are excluded because they have no independent public
contract to probe. Adding a public app or independently failing service requires an explicit product row
with `showOnStatus=true`, its own probe URL, and a documented signal here. Do not
represent multiple independently failing services with one row.
