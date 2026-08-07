import { companyFAQ } from '../../data/company'
import { FaqParagraph } from '../slices/FaqAccordion'
import { commonsFaqItems } from '../commons/faqItems'
import type { FaqGroup } from '../slices/FaqDirectory'
import UnderlineLink from '../slices/UnderlineLink'

/** Plain-string entries from the CMS-adjacent data files, as answer nodes. */
function fromPlain(entries: readonly { question: string; answer: string }[]) {
  return entries.map((entry) => ({
    question: entry.question,
    answer: <FaqParagraph>{entry.answer}</FaqParagraph>,
  }))
}

export const faqGroups: FaqGroup[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is Oxy?',
        answer: (
          <>
            <FaqParagraph>
              An open-source ecosystem of apps and infrastructure: social, messaging, mail, AI, identity, payments and the developer
              tooling underneath them. One account, one session, one set of primitives across all of it.
            </FaqParagraph>
            <FaqParagraph>
              Everything is open source and built to work without us in the middle — you can read the code, run the pieces yourself, or
              build on them.
            </FaqParagraph>
          </>
        ),
      },
      {
        question: 'Is Oxy free to use?',
        answer: (
          <FaqParagraph>
            The apps are free to use, and the source is open. Paid plans exist where a product costs us money to run per user — storage,
            AI inference, hosted infrastructure. The details are on{' '}
            <UnderlineLink href="/pricing">the pricing page</UnderlineLink>.
          </FaqParagraph>
        ),
      },
      {
        question: 'Where do I see what changed?',
        answer: (
          <FaqParagraph>
            Every release across the ecosystem lands on <UnderlineLink href="/changelog">the changelog</UnderlineLink>, and service
            health is on <UnderlineLink href="/status">the status page</UnderlineLink>.
          </FaqParagraph>
        ),
      },
    ],
  },
  {
    title: 'Commons',
    items: commonsFaqItems,
  },
  {
    title: 'Products',
    items: [
      {
        question: 'What apps are in the ecosystem?',
        answer: (
          <FaqParagraph>
            Mention for social, Allo for encrypted messaging, Inbox for mail, Alia for AI, Homiio for housing, FairCoin for payments,
            plus the SDK and Bloom UI underneath. The full list is on{' '}
            <UnderlineLink href="/apps">the apps page</UnderlineLink>.
          </FaqParagraph>
        ),
      },
      {
        question: 'Do I need a separate account per app?',
        answer: (
          <FaqParagraph>
            No. One Oxy account works across every app, and on a device with Commons the session is shared: sign in once and the rest
            follow.
          </FaqParagraph>
        ),
      },
    ],
  },
  {
    title: 'Developers',
    items: [
      {
        question: 'Can I build on Oxy?',
        answer: (
          <FaqParagraph>
            Yes. Register an app, drop in the SDK and you get sign-in, sessions and the platform APIs. Start with the{' '}
            <UnderlineLink href="/developers/docs">developer docs</UnderlineLink>.
          </FaqParagraph>
        ),
      },
      {
        question: 'Is everything really open source?',
        answer: (
          <FaqParagraph>
            The apps, the SDK, the UI library and the infrastructure are public on{' '}
            <UnderlineLink href="https://github.com/OxyHQ" external>
              GitHub
            </UnderlineLink>
            . You can read it, fork it, or run your own instance.
          </FaqParagraph>
        ),
      },
    ],
  },
  {
    title: 'Company',
    items: fromPlain(companyFAQ),
  },
]
