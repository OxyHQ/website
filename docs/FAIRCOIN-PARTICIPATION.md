# FairCoin participation: first delivery

Implements [website #248](https://github.com/OxyHQ/website/issues/248). Nate approved
the two routes and proposed English/Spanish chapter copy in the implementation
session. This is preparation for a pilot, not activation of an exchange or a
commercial offer. There are no confirmed participants or public offers.

## Public surface

| Surface | fairco.in | oxy.so |
| --- | --- | --- |
| Explanation and private application | `/participate/` | `/faircoin/participate/` |
| Proposed method and preparation status | `/pilot/` | `/faircoin/pilot/` |

Both pages retain locale prefixes and trailing slashes. All **15** currently
supported dictionaries contain the new copy (the issue's eleven-locale count
predates the current code). Prerendering and hreflang follow the existing CMS
locale-readiness policy. Meaningful public prose is available without JavaScript;
submission needs JavaScript and an explicitly opened intake. The build never
requests applications or intake configuration.

The FairCoin apex serves these pages from their corresponding prefixed static
documents through Pages middleware, rewriting only their public links and brand
metadata. Its sitemap uses only the FairCoin subset of the same build route list.
FairCoin search uses a public, localized editorial index and does not query Oxy's
documentation or user directory. Oxy search retains its existing behavior.

The active `CashLandingContent` receives one static chapter after its final
scene. The new chapter continues that scene's dark surface and 12-column grid;
it is outside the motion selectors. Intro, phone, objects, timing, typography,
hero CTA and existing purchase operations remain unchanged.

## Intake and approval boundary

Intake defaults to closed. Publishing the code does not open it. Before activation,
the owner must approve a reviewer, retention period and privacy contact, along
with the public activation requirements in the issue. Only then configure:

- `FAIRCOIN_APPLICATIONS_ENABLED=true`
- `FAIRCOIN_APPLICATION_REVIEWER`: responsible reviewer, not an authorization grant
- `FAIRCOIN_APPLICATION_RETENTION_DAYS`: approved integer from 1 to 365
- `FAIRCOIN_APPLICATION_PRIVACY_CONTACT`: approved email for deletion requests

Configuration is validated before listening. These settings do not change the
program's `preparation` state, authorize rewards or enable public offers.

The form asks about a project, private contact email, offer, needs, capacity,
availability, modality, relevant location and proposed conditions. It asks for
contact consent separately from optional future communications. It never asks
for a wallet, keys, identity documents, payment or registration. Publication
permission must be obtained later for a separately reviewed offer.

## Private API and review

| Method and path under `/api/faircoin/applications` | Purpose |
| --- | --- |
| `GET /status` | Public preparation and intake state; approved retention and privacy contact only while open |
| `POST /` | Anonymous application, with UUID `Idempotency-Key` header |
| `GET /?status=submitted&page=1&limit=25` | Authorized private review list |
| `GET /metrics` | Authorized aggregate application counts by review state |
| `PATCH /:id` | Human review, body `{fromStatus, status, internalNote?}` |
| `DELETE /:id` | Authorized permanent deletion |

Management requires the existing `website.content.manage` permission via Core.
There is no new role, public application lookup, public metric endpoint, webhook
or notification. No submissions are included in content backups, MCP tools,
prerender, Pagefind or analytics.

Review starts at `submitted`, moves to `in_review`, then `approved` or `rejected`.
An application can be closed; approved/rejected applications can return to review.
Updates compare the expected prior status, returning 409 if another reviewer
changed it. The actor and time of the latest transition are recorded. **Approved
means reviewed interest, not a published or available offer.** Public offer states,
permission, provider-approved terms and publication review belong to a later phase.

POST validates the same strict Zod schema used by the form. JSON bodies are
bounded to 32 KiB; the anonymous rate guard permits five requests per ten minutes
per process/IP bucket. The database unique key provides durable idempotency
across processes: the same key and normalized payload return the original receipt;
different payloads return 409. The browser retains the key and fields in memory
for retries, without persisting personal data to local or session storage.

Receipts contain only a reference, received state, timestamp and deletion date.
All responses use `Cache-Control: no-store`. Parser and database errors are
redacted before the global logger. Free text remains data, never executable HTML.

Expired applications disappear from review immediately at their expiry time.
The boot/daily retention sweep physically deletes them, so deletion can lag by
up to one sweep interval. The sweep runs even when intake is closed. Authorized
deletion is immediate; process privacy requests through the configured contact.

## Buy inventory and pending decisions

| Existing entry | First delivery |
| --- | --- |
| Get FAIR dropdown: Buy with USDC | Retained |
| Navbar Buy and Buy FairCoin CTA | Retained |
| Footer Buy FairCoin | Retained |
| Landing everyday purchase tile | Retained |
| Phone illustration and wallet purchase references | Retained |
| `/buy/` page, metadata, quote and purchase history | Retained |
| Bridge, unwrap/redeem and holder recovery access | Retained |

New participation links appear in the Community dropdown/footer and the new
chapter. If Nate later approves replacing purchase acquisition, the concrete
editorial proposal is to point the primary navbar CTA at `/participate/` with
“Propose an offer”, while keeping existing holder operations accessible. Disabling
new purchases needs a separate frontend/backend maintenance plan. Neither change
is implemented here. Social-link corrections remain in #187.

Still pending: reviewer/support ownership, retention and deletion policy approval,
public intake activation, commercial terms, Oxy acceptance policy, distribution or
reward rules and any future verified offer publication. No contact research,
outreach, campaigns, payments, distribution or deployment is part of this delivery.

## Verification

Run the repository's lint, `bunx tsc -b`, server typecheck/tests and full build.
The build includes `scripts/faircoin-participation.test.ts` and the new
`test:faircoin-participation:browser` gate. The latter can also target a local
server using `FAIRCOIN_TEST_ORIGIN=http://localhost:5173`.

The contract tests cover translated public prose, escaping, host/locale mapping,
static metadata, links and the host-specific sitemap. Server tests cover closed
intake, validation, racing idempotency, private access, manual transitions,
deletion, retention, CORS and redacted errors. Browser tests cover keyboard use,
validation focus, retry preservation, consent, malformed receipts and confirmation.
The existing FairCoin motion/browser checks remain the visual regression baseline.

Capture all existing sections before/after at 1440×1000 and 390×844, with the same
font/animation state, and inspect 320/768/1024/1920 widths. Local captures and full
command outcomes are reported with the implementation review; code inspection is
not production validation. Deployment and public activation remain separate decisions.
