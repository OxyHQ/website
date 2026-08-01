import type { FaqItem } from '../slices/FaqAccordion'
import { FaqParagraph } from '../slices/FaqAccordion'
import UnderlineLink from '../slices/UnderlineLink'

export const commonsFaqItems: FaqItem[] = [
  {
    question: 'What is Commons?',
    answer: (
      <>
        <FaqParagraph>
          Commons is the Oxy identity app. It creates and holds the cryptographic key that is your account across the Oxy ecosystem, and
          it keeps that key on your device.
        </FaqParagraph>
        <FaqParagraph>
          Everything an account normally needs a password for — signing in, approving a new device, proving a request came from you —
          Commons does by signing with that key instead.
        </FaqParagraph>
      </>
    ),
  },
  {
    question: 'What does self-custody actually mean here?',
    answer: (
      <>
        <FaqParagraph>
          Your private key is generated on your device and never leaves it. There is no copy on our servers, which means no one at Oxy
          can sign as you, hand your key to anyone else, or lose it in a breach.
        </FaqParagraph>
        <FaqParagraph>
          The trade-off is real and worth stating plainly: if you lose the device and your recovery phrase, nobody can restore the
          identity for you. Write the phrase down.
        </FaqParagraph>
      </>
    ),
  },
  {
    question: 'How do I sign in to an Oxy app with Commons?',
    answer: (
      <>
        <FaqParagraph>On the same device, you do nothing. Sign in once and every Oxy app on that device picks the session up.</FaqParagraph>
        <FaqParagraph>
          On another device — a laptop, a friend's machine, a TV — the app shows a QR code. You scan it with Commons, read what is being
          asked for, and approve it with your face or fingerprint. The approval is a signature from your key; the key itself stays on
          your phone.
        </FaqParagraph>
      </>
    ),
  },
  {
    question: 'What is the recovery phrase for?',
    answer: (
      <>
        <FaqParagraph>
          Twelve words, shown once when you create your identity, that regenerate the same key on a new device. It is the only way back
          in if you lose your phone.
        </FaqParagraph>
        <FaqParagraph>
          Write it on paper and keep it somewhere safe. Anyone holding those twelve words holds your identity, so it does not belong in a
          screenshot, a notes app, or a chat with yourself.
        </FaqParagraph>
      </>
    ),
  },
  {
    question: 'Do I need Commons to use Oxy apps?',
    answer: (
      <FaqParagraph>
        No. An ordinary Oxy account works fine. Commons upgrades that account to a self-sovereign one, and the change is reversible: link
        an identity and your account is controlled by your key, unlink it and it goes back to being custodial.
      </FaqParagraph>
    ),
  },
  {
    question: 'What is a DID, and do I have one?',
    answer: (
      <>
        <FaqParagraph>
          A decentralized identifier is a public address for your identity that any service can resolve without asking us for permission.
          Every Oxy account has one, at <code className="font-mono">did:web:oxy.so:u:&lt;your id&gt;</code>.
        </FaqParagraph>
        <FaqParagraph>
          Once you link a Commons identity, that document lists your own key as a verification method and names you as a controller — so
          you can prove things about your account to services that have never heard of Oxy.
        </FaqParagraph>
      </>
    ),
  },
  {
    question: 'What happens if I delete my account?',
    answer: (
      <FaqParagraph>
        Deletion is signed with your key, so only you can request it. Commons deletes the account, purges the identity and its encrypted
        backup from the device, and signs you out everywhere. It cannot be undone — there is no server-side copy to restore from.
      </FaqParagraph>
    ),
  },
  {
    question: 'Where does Commons run?',
    answer: (
      <FaqParagraph>
        On iOS and Android. Commons is deliberately native-only: the key lives in the device's secure hardware — the Secure Enclave or the
        Android keystore — and a browser has nowhere equivalent to put it. Account settings live in{' '}
        <UnderlineLink href="https://accounts.oxy.so" external>
          Oxy Accounts
        </UnderlineLink>
        , which Commons links to directly.
      </FaqParagraph>
    ),
  },
  {
    question: 'Can I build on it?',
    answer: (
      <FaqParagraph>
        Yes. “Sign in with Oxy” is an OAuth flow any app can register for, and the session handling ships in the Oxy SDK, so you get
        device-first sessions and key-signed approvals without writing auth code. Start with the{' '}
        <UnderlineLink href="/developers/docs">developer docs</UnderlineLink>.
      </FaqParagraph>
    ),
  },
]
