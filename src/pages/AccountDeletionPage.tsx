import { Fragment, type ReactNode } from 'react';
import { Link } from '../lib/navigation';
import { ACCOUNT_DELETION_PAGE } from '../lib/transparency';
import TransparencyDocument from '../components/slices/TransparencyDocument';
import { articleMdxComponents } from '../components/slices/articleMdxComponents';
import type { TocEntry } from '../components/slices/ArticleToc';

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

const SUPPORT_EMAIL = 'support@oxy.so';
const PRIVACY_EMAIL = 'legal@oxy.so';

const { h2: Heading, h3: Subheading, p: Paragraph, ul: List } = articleMdxComponents;

const DELETED_SERVER_SIDE = [
  'Your profile and account record — username, display name, avatar, and settings.',
  'All Oxy Mail data: mailboxes, messages, and file attachments stored in our object storage.',
  'The encrypted backup of your identity and your end-to-end encrypted keychain, if you chose to store them with us.',
  'Every active session, on every device, revoked immediately.',
  'Your social graph: who you follow, who follows you, blocks, and restrictions.',
  'Files you uploaded and the developer applications you own.',
];

const RETAINED = [
  {
    title: 'The private key on your device (identity accounts)',
    body: 'Your identity key never leaves your device, so we cannot reach it or erase it. Deleting your account does not remove it. To destroy the key itself, delete the Commons app or clear its data on every device where you used it.',
  },
  {
    title: 'Content already sent to other servers',
    body: 'If you used Mention and shared with the fediverse, your posts were copied to independent servers such as Mastodon instances. We send a deletion request to the servers we know about, but each one is operated by someone else and controls its own copies. We cannot guarantee removal from systems we do not run.',
  },
  {
    title: 'Records we are legally required to keep',
    body: 'Receipts and the financial ledger are never deleted, because the law requires them. If any exist for your account, the account is archived rather than removed, and its profile is not anonymised. If you have no financial records, the account is removed completely.',
  },
];

/** Contents, in document order; each id matches the section heading below. */
const ENTRIES: TocEntry[] = [
  { id: 'what-an-account-is', label: 'What an Oxy account actually is', level: 2 },
  { id: 'how-to-delete', label: 'How to delete it', level: 2 },
  { id: 'when-refused', label: 'When deletion is refused', level: 2 },
  { id: 'why-not-for-you', label: 'Why we cannot delete it for you', level: 2 },
  { id: 'what-we-delete', label: 'What we delete', level: 2 },
  { id: 'what-stays', label: 'What stays, and why', level: 2 },
  { id: 'other-apps', label: 'What happens to the other apps', level: 2 },
  { id: 'questions', label: 'Questions', level: 2 },
];

function Strong({ children }: { children: ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

function MailLink({ address }: { address: string }) {
  return (
    <a className="text-primary underline" href={`mailto:${address}`}>
      {address}
    </a>
  );
}

export default function AccountDeletionPage() {
  return (
    <TransparencyDocument
      canonicalPath={ACCOUNT_DELETION_PAGE.path}
      title={ACCOUNT_DELETION_PAGE.title}
      eyebrow="Your account"
      description="How to permanently delete your Oxy account and identity, what data is removed, and what is kept."
      entries={ENTRIES}
      cta={{
        title: 'Read how we handle your data.',
        label: 'Privacy Policy',
        href: '/transparency/legal/privacy/',
      }}
    >
      <Paragraph>
        You can delete your Oxy account at any time, without asking anyone for permission. This page
        explains how, and exactly what happens to your data.
      </Paragraph>

      <Heading id="what-an-account-is">What an Oxy account actually is</Heading>
      <Paragraph>
        An Oxy account is one of two kinds, and which one you have changes how you delete it.
      </Paragraph>
      <Paragraph>
        <Strong>An identity account</Strong> is a <Strong>cryptographic identity</Strong> — a key
        pair created on your device. The private half of that key never leaves your device. It is
        held in the secure hardware your phone provides (the Android Keystore or the iOS Keychain)
        by the <Strong>Commons</Strong> app, which is the vault for your identity. We never see it,
        never store it, and cannot recover it for you.
      </Paragraph>
      <Paragraph>
        <Strong>An email account</Strong> signs in with your username or email: we send a code or a
        link to your inbox, and you can also set a password and an authenticator app. Anyone who can
        sign in by email can recover access by signing in by email.
      </Paragraph>
      <Paragraph>
        Either way, one account signs you in to every Oxy app — Mention, Commons, Allo, Homiio,
        Noted and Moovo among them. There is one account behind all of them, so deleting it affects
        all of them.
      </Paragraph>

      <Heading id="how-to-delete">How to delete it</Heading>
      <Paragraph>
        Open <Strong>Accounts</Strong> (accounts.oxy.so), go to{' '}
        <Strong>Data → Delete account</Strong> and type your username, which has to match exactly.
        Then confirm:
      </Paragraph>
      <List>
        <li>
          <Strong>Identity account:</Strong> Accounts opens Commons, and your device signs the
          request with your identity key, which is what proves to our servers that it is really
          yours. If you set up an authenticator code, you also enter it.
        </li>
        <li>
          <Strong>Email account:</Strong> you confirm with a code we send to your email (or with
          your password if the account has no email), plus your authenticator code if you set one
          up.
        </li>
      </List>
      <Paragraph>
        The deletion runs immediately. There is no waiting period and no way to undo it, so make
        sure you have exported anything you want to keep first.
      </Paragraph>

      <Heading id="when-refused">When deletion is refused</Heading>
      <Paragraph>
        We refuse the request, and tell you why, while your account has any of these. Resolve them
        first and try again:
      </Paragraph>
      <List>
        <li>A live subscription. Cancel it first.</li>
        <li>A checkout in progress.</li>
        <li>A reservation held for an AI inference request.</li>
        <li>A connected provider key. Disconnect it in Console.</li>
      </List>

      <Heading id="why-not-for-you">Why we cannot delete it for you</Heading>
      <Paragraph>
        An identity account is a key you hold, so our servers only accept a deletion request that
        carries a valid signature from that key, made within the last few minutes. Without it, the
        request is rejected. Email accounts instead confirm with a fresh emailed code or password.
      </Paragraph>
      <Paragraph>
        That means no one can delete your account by impersonating you — not an attacker who takes
        over your email, not someone at a support desk, and not us. The same property that makes the
        account yours also makes you the only one who can end it.
      </Paragraph>
      <Paragraph>
        The trade-off is real and worth stating plainly: if you have an identity account, lose every
        device holding your key and never stored an encrypted backup with us, you can no longer sign
        in and you can no longer issue a deletion request either. An email account does not have
        this problem. If this happened to you, write to <MailLink address={SUPPORT_EMAIL} /> and we
        will explain what we can and cannot remove without your key.
      </Paragraph>

      <Heading id="what-we-delete">What we delete</Heading>
      <Paragraph>When the request is accepted, we permanently remove:</Paragraph>
      <List>
        {DELETED_SERVER_SIDE.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </List>
      <Paragraph>
        Counters on other people&apos;s accounts — follower and following totals — are corrected at
        the same time, so your removal does not leave inconsistent numbers behind.
      </Paragraph>

      <Heading id="what-stays">What stays, and why</Heading>
      <Paragraph>
        We would rather tell you this than let you discover it later. Three things survive deletion:
      </Paragraph>
      {RETAINED.map((item) => (
        <Fragment key={item.title}>
          <Subheading>{item.title}</Subheading>
          <Paragraph>{item.body}</Paragraph>
        </Fragment>
      ))}

      <Heading id="other-apps">What happens to the other apps</Heading>
      <Paragraph>
        Every Oxy app signs in with the same account, so deleting it signs you out of all of them
        and removes the account-level data listed above.
      </Paragraph>
      <Paragraph>
        Apps that rely on Oxy are told your account was deleted so they can erase what they hold for
        you. Mention, for example, erases the account&apos;s data and keeps the handle reserved for
        14 days. The exception is content that already left our systems through federation,
        described above.
      </Paragraph>
      <Paragraph>
        Deleting a single app from your phone does not delete your account. It only removes that
        app. Your account stays and you can keep using the rest.
      </Paragraph>

      <Heading id="questions">Questions</Heading>
      <Paragraph>
        If you cannot complete the steps above, or you want to know what we hold about you before
        deciding, write to <MailLink address={SUPPORT_EMAIL} />. For privacy and data-protection
        requests specifically, use <MailLink address={PRIVACY_EMAIL} />.
      </Paragraph>
      <Paragraph>
        See also our{' '}
        <Link className="text-primary underline" to="/transparency/legal/privacy">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link className="text-primary underline" to="/transparency/legal/terms">
          Terms &amp; Conditions
        </Link>
        .
      </Paragraph>
    </TransparencyDocument>
  );
}
