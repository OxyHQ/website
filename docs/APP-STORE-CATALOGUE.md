# Moving the catalogue to the App Store

The plan says the website's `products` table moves to the store and this site
becomes a client. Before writing any of that, the two lists were compared. They
do not line up, and that is the finding: **this is a reconciliation, not a
migration.**

Measured on 2026-08-08, against the live `applications` table in oxy-api's
Postgres and the live `/api/products` on this site.

## What each list actually is

`applications` holds **OAuth clients** — 18 active, plus 9 rows in `deleted`
that are third-party duplicates of first-party apps, created and removed on
2026-08-06. It includes infrastructure nobody would ever list in a store:
`Oxy Auth`, `Oxy Console`, `Oxy Accounts`, `Oxy Website`, and an internal
`Allo Matrix Authentication Service`.

`products` holds **the marketing catalogue** — 16 rows, including things that
have no OAuth client at all because they are not programs a person signs into
with an Oxy account: FairCoin, its explorer and wallet, Clarity, Astro.

## The overlap

**Eight pair up.** Seven by name, and one only after reading it:
`Inbox by Oxy` (product) is `Oxy Inbox` (application) — the words are reversed,
so no automated match finds it, which is precisely why a slug has to be written
down rather than derived.

| product | application |
|---|---|
| `mention` Mention | Mention |
| `tnp` TNP | TNP |
| `homiio` Homiio | Homiio |
| `2` Homiio | Homiio — **the same app, listed twice** (see below) |
| `pay` Pay | Oxy Pay |
| `marketplace` Mercaria | Mercaria |
| `m` Moovo | Moovo |
| `i` Inbox by Oxy | Oxy Inbox |

**Eight products have no application**: FairCoin, FairCoin Explorer,
FAIRWallet, Clarity, Astro Browser, Alia, Kaana, Horizon. Some will get one
(Astro and Alia are programs); some never will (FairCoin is a currency, not a
client).

**Eleven applications have no product**: Allo, Commons by Oxy, CrowdSource,
Noted, Schedio, Syra, Oxy Accounts, Oxy Auth, Oxy Console, Oxy Website, and the
internal Matrix service. Some are missing from the marketing site by oversight
(Allo, Syra, Commons); the rest are infrastructure and should stay unlisted.

## What this means for the store

1. **A listing cannot be created for a product that has no application.** The
   listing's primary key is the application's. So the move is: create the
   missing applications for the products that deserve one, decide which
   products are not apps at all, and only then write the listings.
2. **`app_listings.slug` takes the product's `productId`** for the eight that
   pair up — that is what keeps `/apps/mention` working through the move.
3. **The single-letter ids are not slugs.** `i`, `2`, `c`, `m` are what the
   catalogue grew, and they cannot survive as public URLs. Each needs a real
   one written down before it becomes a store address.

## The duplicate to resolve first

`products` carries **Homiio twice** — `homiio` ("Rental made easy") and `2`
("Real estate platform"). Both are live, both are in the Ecosystem menu, and
both point at the same application. One of them has to go, and which one is a
content decision, not a migration one.
