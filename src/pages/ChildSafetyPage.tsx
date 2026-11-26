import type { ReactNode } from 'react';
import TransparencyDocument from '../components/slices/TransparencyDocument';
import { articleMdxComponents } from '../components/slices/articleMdxComponents';
import { ARTICLE_BLOCK } from '../components/slices/articleBlock';
import type { TocEntry } from '../components/slices/ArticleToc';
import { Link } from '../lib/navigation';
import { CHILD_SAFETY_PAGE } from '../lib/transparency';

/* ──────────────────────────────────────────────
 * /transparency/child-safety
 *
 * Child safety standards against child sexual abuse and exploitation (CSAE).
 * Google Play asks for a public URL for these standards, reachable without
 * signing in, for every app that lets people talk to each other. Like
 * `AccountDeletionPage`, it is deliberately static, not a CMS document: a
 * compliance page must render identically on a fresh database.
 *
 * Every claim below is taken from the implementation, and what Oxy has not
 * built is not promised:
 *   - Mention's report flow has a `child_safety` reason; it is referred to Oxy's
 *     reviewed takedown, never shown to a jury (Mention docs/moderation-crowdsource.md,
 *     ContentReferralWorker).
 *   - Oxy ADR 0043 D10/D14: nothing is blocked until a person on the staff acts;
 *     a block covers the bytes for every owner and adds the hash to the
 *     blocklist; for `child_safety` the owner is not sent the claim email and
 *     cannot counter-notice; reporting to the competent authority is a staff
 *     step, and the claim's audit trail and evidence hold are what it works from.
 *   - ADR 0067/0068: age bands and protective defaults by age.
 *   - Mention's federation block policy has a `child_safety` category.
 * Keep them in sync: an inaccurate safety page is a policy problem, not a stale doc.
 * ──────────────────────────────────────────── */

const { h2: Heading, p: Paragraph } = articleMdxComponents;

const ENTRIES: TocEntry[] = [
  { id: 'commitment', label: 'Our commitment', level: 2 },
  { id: 'prohibited', label: 'What is not allowed', level: 2 },
  { id: 'report', label: 'How to report it', level: 2 },
  { id: 'what-happens', label: 'What happens after a report', level: 2 },
  { id: 'authorities', label: 'Reporting to the authorities', level: 2 },
  { id: 'minors', label: 'Protecting young people on Oxy', level: 2 },
  { id: 'federation', label: 'Other servers we connect to', level: 2 },
  { id: 'law', label: 'The law', level: 2 },
  { id: 'contact', label: 'Child safety contact', level: 2 },
];

const LIST = `${ARTICLE_BLOCK} w-full min-w-0 text-blog-body text-foreground [&_li]:mb-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5`;

function Strong({ children }: { children: ReactNode }) {
  return <strong className="text-foreground">{children}</strong>;
}

export default function ChildSafetyPage() {
  return (
    <TransparencyDocument
      canonicalPath={CHILD_SAFETY_PAGE.path}
      title={CHILD_SAFETY_PAGE.title}
      eyebrow="Safety"
      description={CHILD_SAFETY_PAGE.description}
      entries={ENTRIES}
      cta={{
        title: 'Report something now.',
        label: 'Report content',
        href: '/transparency/legal/report-content/',
      }}
    >
      <Paragraph>Last updated 26 November 2026.</Paragraph>

      <Heading id="commitment">Our commitment</Heading>
      <Paragraph>
        Oxy has zero tolerance for child sexual abuse and exploitation (CSAE), including child
        sexual abuse material (CSAM). It is not allowed anywhere on Oxy: not in Mention, not in
        messages, files, profiles, listings or notes, and not in anything made with our AI features.
        This page sets out the standards we hold ourselves and everyone who uses Oxy to, how you can
        report it, and what we do when we find it.
      </Paragraph>

      <Heading id="prohibited">What is not allowed</Heading>
      <Paragraph>You may not post, store, send, request or share:</Paragraph>
      <div className={LIST}>
        <ul>
          <li>
            Child sexual abuse material of any kind, including images, video, text and links, and
            including material that is synthetic, AI-generated, drawn or edited if it sexualises a
            minor.
          </li>
          <li>Any sexualised depiction of, or sexual content about, a person under 18.</li>
          <li>
            Grooming: contacting a minor to build trust for sexual purposes, or to move them to
            another platform or a private channel for that purpose.
          </li>
          <li>Soliciting, requesting or trading sexual content involving minors.</li>
          <li>
            Sextortion: threatening or pressuring anyone, in particular a minor, over intimate
            images.
          </li>
          <li>Trafficking, or advertising or arranging the sexual exploitation of a minor.</li>
          <li>Content that promotes, normalises or gives instructions for any of the above.</li>
        </ul>
      </div>
      <Paragraph>
        Accounts that do this are suspended or ended, and the content is removed. This applies the
        same way to everyone, whatever they post and wherever on Oxy they post it.
      </Paragraph>

      <Heading id="report">How to report it</Heading>
      <Paragraph>Tell us as soon as you see something. You can:</Paragraph>
      <div className={LIST}>
        <ul>
          <li>
            <Strong>Report it in the app.</Strong> In Mention, use Report on a post, a profile or a
            piece of media and choose <Strong>child safety</Strong>.
          </li>
          <li>
            <Strong>Use the report form</Strong> at{' '}
            <Link className="text-primary underline" to="/transparency/legal/report-content">
              Report content
            </Link>
            , for anything on Oxy, with a link to where it is.
          </li>
          <li>
            <Strong>Write to us</Strong> at{' '}
            <a className="text-primary underline" href="mailto:legal@oxy.so">
              legal@oxy.so
            </a>{' '}
            with the subject &ldquo;Child safety&rdquo;.
          </li>
        </ul>
      </div>
      <Paragraph>
        Messages in Allo are end-to-end encrypted, so we cannot see them. If someone sends you
        something that exploits a child, do not forward it; report the person and say what happened
        using the channels above. If a child is in immediate danger, contact your local emergency
        services first.
      </Paragraph>

      <Heading id="what-happens">What happens after a report</Heading>
      <div className={LIST}>
        <ul>
          <li>
            <Strong>A person reviews it.</Strong> A child safety report is not shown to a vote or a
            jury and is not decided by software. It is referred to Oxy&apos;s reviewed takedown
            queue, and nothing is blocked until a member of our staff has looked at it and decided.
          </li>
          <li>
            <Strong>Confirmed material is blocked for everyone.</Strong> The file is blocked for
            every owner and every app that uses it, and its fingerprint goes on a blocklist, so the
            same file cannot be uploaded again.
          </li>
          <li>
            <Strong>The uploader is not given a way to dispute it in the usual way.</Strong> For
            child safety, the owner is not sent the claim notice and cannot answer it with a
            counter-notice. If we blocked something by mistake, our staff record the dispute and
            reinstate it.
          </li>
          <li>
            <Strong>The account is dealt with.</Strong> Depending on what we find, we restrict,
            suspend or end the account.
          </li>
          <li>
            <Strong>Your identity stays private.</Strong> The app that refers a report to us does
            not tell us who made it.
          </li>
        </ul>
      </div>
      <Paragraph>
        Reports are the main way we find this material, so please make them. We act on what people
        report and on what we can see.
      </Paragraph>

      <Heading id="authorities">Reporting to the authorities</Heading>
      <Paragraph>
        When we confirm child sexual abuse material, we keep the evidence and the record of the
        case, and we report it to the competent authority as the law requires. Oxy Platforms, Inc.
        is a United States company, and in the United States that means the National Center for
        Missing &amp; Exploited Children (NCMEC). We also respond to valid requests from law
        enforcement about child safety.
      </Paragraph>

      <Heading id="minors">Protecting young people on Oxy</Heading>
      <Paragraph>
        We ask for a date of birth when you sign up, and apps receive an age band (under 13, 13 to
        17, or adult), never the date. A child under 13 can have an account only under a guardian:
        the account is created private and nothing it can reach opens until a guardian accepts.
        Accounts for people aged 13 to 17 start with protections on by default, including a
        chronological feed, no autoplay and quiet hours from 22:00 to 07:00. The date of birth is
        declared by the person and is not verified. Read more in our{' '}
        <Link className="text-primary underline" to="/transparency/legal/privacy">
          Privacy Policy
        </Link>
        .
      </Paragraph>

      <Heading id="federation">Other servers we connect to</Heading>
      <Paragraph>
        Mention can exchange posts with independent servers across the fediverse. We keep a block
        list for that, and servers known to host child sexual abuse material are on it, so their
        content does not reach Mention.
      </Paragraph>

      <Heading id="law">The law</Heading>
      <Paragraph>
        We follow the child safety laws that apply to us, including the duty to report confirmed
        material and to keep evidence for the authorities. These standards sit alongside our{' '}
        <Link className="text-primary underline" to="/transparency/legal/aup">
          Acceptable Use Policy
        </Link>{' '}
        and{' '}
        <Link className="text-primary underline" to="/transparency/legal/terms">
          Terms &amp; Conditions
        </Link>
        , which also prohibit this content.
      </Paragraph>

      <Heading id="contact">Child safety contact</Heading>
      <Paragraph>
        For child safety matters, including questions from regulators and law enforcement, write to{' '}
        <a className="text-primary underline" href="mailto:legal@oxy.so">
          legal@oxy.so
        </a>{' '}
        with the subject &ldquo;Child safety&rdquo;, or to Oxy Platforms, Inc., 2810 N Church St,
        STE 91894, Wilmington, DE 19802, USA.
      </Paragraph>
    </TransparencyDocument>
  );
}
