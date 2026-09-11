# Public status signals

The status API probes every product explicitly enabled for the public board.
HTTP is only reachability. Services with a functional alarm must also have that
alarm in `OK`; a missing alarm, an unreadable CloudWatch response or
`INSUFFICIENT_DATA` becomes `unknown`, never operational.

| Service | Reachability | Functional signal | Dependencies |
| --- | --- | --- | --- |
| Alia | `GET https://api.alia.onl/health/ready` (process + PostgreSQL readiness) | `oxy-alia-functional-failures`: repeated passive capability-loading or Kaana inference failures in two of three five-minute periods | Oxy API and Kaana |
| Kaana | `GET https://kaana.ai/livez` | `oxy-kaana-routing-readiness-not-confirmed`: the existing free, scheduled routing-score and catalogue proof | none |
| Other public board entries | Their explicit CMS `healthUrl`, otherwise their public `href` | reachability only until the owning service publishes a non-billable authoritative signal | none declared |

The status backend reads only the two exact CloudWatch metric alarms through its
ECS task role. It does not read application logs, provider names, model names,
credentials or alarm reasons. It never sends an inference request. An Alia
dependency can only worsen Alia's state; a green landing page cannot mask a
failed inference data plane or authorization path.

Every app with a public Oxy surface or public backend is enabled on the board,
including Nilo and the other products still labelled `in-development`; their
status describes current reachability, not product maturity. Worker-only and
private MCP/ECS components are excluded because they have no independent public
contract to probe. Adding a public app or independently failing service requires an explicit product row
with `showOnStatus=true`, its own probe URL, and a documented signal here. Do not
represent multiple independently failing services with one row.
