import type { ComponentType } from 'react'
import { CashIcon, EmergencyIcon, GiftIcon, GlobeIcon, HomeIcon, MusicIcon, RocketIcon } from './PayIcons'

/** One of the drifting savings cards in the "Industry-leading interest" scene. */
export interface PayAccount {
  label: string
  balance: string
  icon: ComponentType<{ width?: number | string; height?: number | string }>
  iconSize: number
  /** Resting position inside the 1120×536 stage, before the parallax offset. */
  left: number
  top: number
  /** 0 = furthest back (blurred, small), 1 = closest to the viewer. */
  depth: number
}

export const PAY_ACCOUNTS: readonly PayAccount[] = [
  { label: 'Japan Trip', balance: '$6,847.12', icon: GlobeIcon, iconSize: 16, left: 132, top: 96, depth: 1 },
  { label: 'Savings', balance: '$8,763.45', icon: CashIcon, iconSize: 14, left: 118, top: 22, depth: 0.07 },
  { label: 'Savings', balance: '$8,000.00', icon: CashIcon, iconSize: 14, left: 470, top: 34, depth: 0.14 },
  { label: 'Recitals', balance: '$8,000.00', icon: MusicIcon, iconSize: 14, left: 604, top: 118, depth: 0.36 },
  { label: 'New bike', balance: '$2,487.63', icon: RocketIcon, iconSize: 14, left: 236, top: 322, depth: 0.29 },
  { label: 'New House', balance: '$22,905.71', icon: HomeIcon, iconSize: 14, left: 792, top: 62, depth: 0.96 },
  { label: 'Holiday Gifts', balance: '$2,621.64', icon: GiftIcon, iconSize: 14, left: 690, top: 358, depth: 0.01 },
  { label: 'Emergency', balance: '$7,248.21', icon: EmergencyIcon, iconSize: 14, left: 848, top: 306, depth: 0.99 },
]

/** A row in the Activity scene. `tone` drives the amount colour. */
export interface PayActivityRow {
  merchant: string
  amount: string
  date: string
  method: string
  verified: boolean
  incoming: boolean
  glyph: 'home' | 'app' | 'incoming'
}

export const PAY_ACTIVITY: readonly PayActivityRow[] = [
  { merchant: 'July rent', amount: '$3,100.00', date: '17 Jul 2026', method: 'Transfer', verified: false, incoming: false, glyph: 'home' },
  { merchant: 'Homiio deposit', amount: '$8.00', date: '18 Jul 2026', method: 'Oxy Pay', verified: true, incoming: false, glyph: 'app' },
  { merchant: 'Invoice paid', amount: '$6,200.00', date: '16 Jul 2026', method: 'FairCoin', verified: true, incoming: true, glyph: 'incoming' },
]

/** A card in the "Send money instantly" toast stack. */
export interface PayTransfer {
  amount: string
  recipient: string
  age: string
}

export const PAY_TRANSFERS: readonly PayTransfer[] = [
  { amount: '$1,200.00', recipient: 'Alex', age: '3h' },
  { amount: '$160.00', recipient: 'Amanda', age: '4h' },
  { amount: '$26.52', recipient: 'Joel', age: '5h' },
]

/** The numbered feature list. `scene` picks the mock rendered beside the copy. */
export interface PayFeature {
  index: string
  title: string
  body: string
  scene: 'activity' | 'transfers' | 'card' | 'cashback' | 'security' | 'support'
  /** Tailwind column classes — the list is a contents-grid at tablet-lg and up. */
  mediaClassName: string
  copyClassName: string
  /** Media comes first on mobile only for the odd rows, matching the source layout. */
  mediaOrder: string
  copyOrder: string
  padded: boolean
}

export const PAY_FEATURES: readonly PayFeature[] = [
  {
    index: '01',
    title: 'One activity feed',
    body: 'Money in, money out and what it was for, in the same place as the apps it came from.',
    scene: 'activity',
    mediaClassName: 'tablet-lg:aspect-[9/8] tablet-lg:col-span-2 tablet-lg:col-start-1',
    copyClassName: 'tablet-lg:col-start-3',
    mediaOrder: 'order-1 mobile:order-2',
    copyOrder: 'order-2 mobile:order-1',
    padded: true,
  },
  {
    index: '02',
    title: 'Pay anyone on Oxy',
    body: 'Send to an Oxy handle instead of an account number. Your contacts stay yours: the graph is never sold or rented.',
    scene: 'transfers',
    mediaClassName: 'tablet-lg:aspect-[9/8] tablet-lg:col-span-2 tablet-lg:col-start-5',
    copyClassName: 'tablet-lg:col-start-7',
    mediaOrder: 'order-1 mobile:order-1',
    copyOrder: 'order-2 mobile:order-2',
    padded: true,
  },
  {
    index: '03',
    title: 'One balance, several rails',
    body: 'Bank transfer, card and FairCoin behind one balance, so you are not juggling three apps to move the same money.',
    scene: 'card',
    mediaClassName: 'tablet-lg:aspect-[7/3] tablet-lg:col-span-4 tablet-lg:col-start-3',
    copyClassName: 'tablet-lg:col-start-7',
    mediaOrder: 'order-1 mobile:order-2',
    copyOrder: 'order-2 mobile:order-1',
    padded: true,
  },
  {
    index: '04',
    title: 'Fees you can read',
    body: 'Every fee stated before you confirm, in the currency you are paying. No spread hidden inside the exchange rate.',
    scene: 'cashback',
    mediaClassName: 'tablet-lg:aspect-[9/8] tablet-lg:col-span-2 tablet-lg:col-start-1',
    copyClassName: 'tablet-lg:col-start-3',
    mediaOrder: 'order-1 mobile:order-1',
    copyOrder: 'order-2 mobile:order-2',
    padded: false,
  },
  {
    index: '05',
    title: 'Keys and limits you control',
    body: 'Passkeys, per-transaction limits and privacy controls, on the same Oxy ID you already hold on your device.',
    scene: 'security',
    mediaClassName: 'tablet-lg:aspect-[9/8] tablet-lg:col-span-2 tablet-lg:col-start-5',
    copyClassName: 'tablet-lg:col-start-7',
    mediaOrder: 'order-1 mobile:order-2',
    copyOrder: 'order-2 mobile:order-1',
    padded: true,
  },
  {
    index: '06',
    title: 'Support by a person',
    body: 'A human you can reach when money is involved, not a maze designed to make you give up.',
    scene: 'support',
    mediaClassName: 'tablet-lg:aspect-[7/3] tablet-lg:col-span-4 tablet-lg:col-start-1',
    copyClassName: 'tablet-lg:col-start-5',
    mediaOrder: 'order-1 mobile:order-1',
    copyOrder: 'order-2 mobile:order-2',
    padded: true,
  },
]

export interface PayFaq {
  question: string
  answer: string
}

export const PAY_FAQS: readonly PayFaq[] = [
  {
    question: 'Is Oxy Pay available yet?',
    answer:
      'No. Oxy Pay is in development and nobody can deposit or move money through it today. This page describes what we are building and the rules it has to follow, not a product you can sign up for.',
  },
  {
    question: 'What will you publish before it opens?',
    answer:
      'Who holds the funds, under which licence and in which country, what each fee is, and what happens to your money if Oxy disappears. Those answers land before the first deposit, not after.',
  },
  {
    question: 'How does it relate to FairCoin?',
    answer:
      'FairCoin is the part of this that already exists: a network, a self-custodied wallet, a public explorer and a bridge. Oxy Pay is meant to make it usable next to ordinary money rather than replace it.',
  },
  {
    question: 'Is my financial activity private?',
    answer:
      'Balances and transactions are private by default and never appear on a public profile. We do not sell or rent financial data, and we do not run advertising against it. That is a commitment in the Founding Charter, not a setting.',
  },
  {
    question: 'Will there be a card?',
    answer:
      'It is on the roadmap. We are not naming a network, a launch date or a set of benefits until the agreements behind them are signed, because a payments page is exactly where vague promises do the most damage.',
  },
  {
    question: 'Can I self-host or leave?',
    answer:
      'FairCoin is self-custodied by design, and anything Oxy Pay stores about you is exportable. Leaving should cost you nothing beyond the time it takes to download it.',
  },
]
