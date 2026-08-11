import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { AnimatedTitle } from '../components/ui/AnimatedTitle'

/* ──────────────────────────────────────────────
 * /account-deletion
 *
 * Public account-deletion page. Google Play requires a URL that is
 * reachable WITHOUT signing in, where a user can find out how to delete
 * their account and what data is removed versus retained. It is linked
 * from the Play Console Data safety form for every Oxy app.
 *
 * Deliberately static — no CMS document, no `usePage` hook. A compliance
 * page must render identically on a fresh database; a page that degrades
 * to "this document is being prepared" (as the CMS-backed LegalPage does
 * when its document is missing) would fail the requirement it exists to
 * satisfy.
 *
 * Every factual claim below is taken from the implementation:
 *   - `DELETE /users/me` in OxyHQServices `packages/api/src/routes/users.ts`
 *     verifies a signature over `delete:{publicKey}:{timestamp}`, requires a
 *     timestamp fresher than 5 minutes, and requires `confirmText` to equal
 *     the username.
 *   - It then deletes email data (mailboxes, messages, S3 attachments), the
 *     encrypted off-device identity backup, every session and device-session
 *     link, the social graph (with counterparty counts repaired), and the
 *     user document.
 * Keep them in sync — an inaccurate deletion page is a policy problem, not
 * just a stale doc.
 * ──────────────────────────────────────────── */

const SUPPORT_EMAIL = 'support@oxy.so'
const PRIVACY_EMAIL = 'legal@oxy.so'

const DELETED_SERVER_SIDE = [
  'Your profile and account record — username, display name, avatar, and settings.',
  'All Oxy Mail data: mailboxes, messages, and file attachments stored in our object storage.',
  'The encrypted backup of your identity, if you chose to store one with us.',
  'Every active session, on every device, revoked immediately.',
  'Your social graph: who you follow, who follows you, blocks, and restrictions.',
]

const RETAINED = [
  {
    title: 'The private key on your device',
    body: 'Your identity key never leaves your device, so we cannot reach it or erase it. Deleting your account does not remove it. To destroy the key itself, delete the Commons app or clear its data on every device where you used it.',
  },
  {
    title: 'Content already sent to other servers',
    body: 'If you used Mention and shared with the fediverse, your posts were copied to independent servers such as Mastodon instances. We send a deletion request to the servers we know about, but each one is operated by someone else and controls its own copies. We cannot guarantee removal from systems we do not run.',
  },
  {
    title: 'Records we are legally required to keep',
    body: 'Limited transaction and billing records may be retained where law requires it. These are kept separately from your profile and are not used to identify you afterwards.',
  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-medium text-foreground">{title}</h2>
      <div className="space-y-4 text-muted-foreground">{children}</div>
    </section>
  )
}

export default function AccountDeletionPage() {
  return (
    <>
      <SEO
        title="Delete your Oxy account"
        description="How to permanently delete your Oxy account and identity, what data is removed, and what is kept."
        canonicalPath="/account-deletion"
      />
      <Navbar />
      <main className="container max-w-3xl py-16">
        <AnimatedTitle as="h1" className="text-heading-responsive-lg text-foreground">Delete your Oxy account</AnimatedTitle>
        <p className="mt-4 text-lg text-muted-foreground">
          You can delete your Oxy account at any time, from your own device, without asking anyone
          for permission. This page explains how, and exactly what happens to your data.
        </p>

        <Section title="What an Oxy account actually is">
          <p>
            An Oxy account is not an email address and a password. It is a{' '}
            <strong className="text-foreground">cryptographic identity</strong> — a key pair created
            on your device the first time you sign up.
          </p>
          <p>
            The private half of that key never leaves your device. It is held in the secure hardware
            your phone provides (the Android Keystore or the iOS Keychain) by the{' '}
            <strong className="text-foreground">Commons</strong> app, which is the vault for your
            identity. We never see it, never store it, and cannot recover it for you.
          </p>
          <p>
            That single identity is what signs you in to every Oxy app on the same device — Mention,
            Commons, Allo, Homiio, Noted and Moovo among them. There is one account behind all of
            them, so deleting it affects all of them.
          </p>
        </Section>

        <Section title="How to delete it">
          <p>Deletion is done from the Commons app, on a device where you are signed in:</p>
          <ol className="ml-5 list-decimal space-y-2">
            <li>Open <strong className="text-foreground">Commons</strong>.</li>
            <li>Go to <strong className="text-foreground">Settings → Delete account</strong>.</li>
            <li>Type your username to confirm. This has to match exactly.</li>
            <li>
              Approve the request. Your device signs it with your identity key, which is what proves
              to our servers that the request is really yours.
            </li>
          </ol>
          <p>
            The deletion runs immediately. There is no waiting period and no way to undo it, so make
            sure you have exported anything you want to keep first.
          </p>
        </Section>

        <Section title="Why we cannot delete it for you">
          <p>
            Because your account is a key you hold, our servers only accept a deletion request that
            carries a valid signature from that key, made within the last few minutes. Without it,
            the request is rejected.
          </p>
          <p>
            That means no one can delete your account by impersonating you — not an attacker who
            takes over your email, not someone at a support desk, and not us. The same property that
            makes the account yours also makes you the only one who can end it.
          </p>
          <p>
            The trade-off is real and worth stating plainly: if you lose every device holding your
            key and you never stored an encrypted backup with us, you can no longer sign in and you
            can no longer issue a deletion request either. In that case write to{' '}
            <a className="text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{' '}
            and we will explain what we can and cannot remove without your key.
          </p>
        </Section>

        <Section title="What we delete">
          <p>When the request is accepted, we permanently remove:</p>
          <ul className="ml-5 list-disc space-y-2">
            {DELETED_SERVER_SIDE.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Counters on other people&apos;s accounts — follower and following totals — are corrected
            at the same time, so your removal does not leave inconsistent numbers behind.
          </p>
        </Section>

        <Section title="What stays, and why">
          <p>
            We would rather tell you this than let you discover it later. Three things survive
            deletion:
          </p>
          <div className="space-y-6">
            {RETAINED.map((item) => (
              <div key={item.title}>
                <h3 className="mb-1 font-medium text-foreground">{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What happens to the other apps">
          <p>
            Every Oxy app signs in with the same identity, so deleting your account signs you out of
            all of them and removes the account-level data listed above.
          </p>
          <p>
            Content you created inside an individual app is deleted along with the account record it
            belonged to. The one exception is content that already left our systems through
            federation, described above.
          </p>
          <p>
            Deleting a single app from your phone does not delete your account. It only removes that
            app. Your identity stays in Commons and you can keep using the rest.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            If you cannot complete the steps above, or you want to know what we hold about you before
            deciding, write to{' '}
            <a className="text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            . For privacy and data-protection requests specifically, use{' '}
            <a className="text-foreground underline" href={`mailto:${PRIVACY_EMAIL}`}>
              {PRIVACY_EMAIL}
            </a>
            .
          </p>
          <p>
            See also our{' '}
            <Link className="text-foreground underline" to="/legal/privacy">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link className="text-foreground underline" to="/legal/terms">
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </Section>
      </main>
      <Footer />
    </>
  )
}
