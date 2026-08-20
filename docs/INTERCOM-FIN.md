# Intercom Fin integration

The website installs Intercom for visitors and authenticated Oxy users. The
authenticated user token is signed by `INTERCOM_MESSENGER_SECRET` on the
server. The same short-lived token is exposed to Intercom as the `security_token`
User authentication token for Fin Data connectors.

## Intercom setup

1. In Intercom, open **Settings → Integrations → Authentication → Add token**.
2. Create a **Custom → User** token named `security_token`.
3. Configure the token to send as `Authorization: Bearer <token>`.
4. Create Data connectors for the routes below.
5. Enable **Customer authentication** in each connector's Security tab.
6. Use Messenger Security (JWT) for the Messenger audience.

Available connector routes:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/intercom/connectors/account-context` | Verified user's basic account context |
| GET | `/api/intercom/connectors/service-status` | All public service health, or `?service_id=alia` for one service |
| GET | `/api/intercom/connectors/feature-apps` | Feature Board app allow-list |
| POST | `/api/intercom/connectors/feature-proposal` | Creates a proposal after `confirmed: true` |

The connector base URL in production is `https://website-api.oxy.so`.

The feature proposal connector accepts:

```json
{
  "confirmed": true,
  "app": "oxyhq/website",
  "title": "A useful feature title",
  "body": "A detailed description with at least thirty characters."
}
```

Fin must collect and confirm the app, title and description before calling it.
The backend still enforces the Feature Board allow-list, text limits, sanitizing,
per-user quota, and GitHub write credential. It never accepts a user id from the
request body; identity comes from the verified JWT.

## Fin deployment

Start with a Procedure or Workflow that:

1. Lets Fin answer from the Help Center and Oxy docs.
2. Calls `account-context` or `service-status` for live information.
3. Calls `feature-apps` before asking where a proposal belongs.
4. Requires an explicit confirmation before `feature-proposal`.
5. Hands off to a teammate on authentication, billing, deletion, security or
   any connector error.

Do not use a broad “customer sends any message” Fin trigger. It can re-enter
while a teammate is already handling the conversation.

## Local verification

The API route is protected by the same JWT secret used by Messenger Security.
Set `INTERCOM_MESSENGER_SECRET` in the server environment, then use Intercom's
Data connector **Test connection** with a logged-in test profile. Do not put the
secret in a `VITE_` variable or in the connector request body.
