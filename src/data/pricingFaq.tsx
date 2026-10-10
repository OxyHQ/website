import type { FaqGroup } from '../components/sections/FaqSection';
import { Link } from '../lib/navigation';
import {
  OXY_ONE_PERSONAL_PLANS,
  OXY_ONE_FAMILY_MEMBERS,
  type PersonalPlanMode,
  OXY_ONE_BUSINESS_PLANS,
  OXY_ONE_CREATOR_PLANS,
} from './pricing';

export const PRICING_FAQ_GROUPS = [
  {
    title: 'Getting started',
    items: [
      {
        question: 'Can I use Oxy without a paid plan?',
        answer:
          'Yes. Personal plans include Free, Go, Pro, Max and Ultra. Business has its own Go, Pro, Max and Ultra plans, and Creator is available separately. The Oxy apps are free and open source, so you can get started without choosing a paid plan.',
      },
      {
        question: 'What comes with a free account?',
        answer: (
          <>
            Your Oxy account and the free, open-source apps are available without Oxy One. Each
            app’s free usage allowance still applies, and you can buy extra credits when you need
            them.{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/apps/"
            >
              Explore the apps
            </Link>{' '}
            to find the tools you want to use.
          </>
        ),
      },
      {
        question: 'Which option should I look at first?',
        answer: (
          <>
            For benefits across Oxy products, start with{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/one/"
            >
              Oxy One
            </Link>
            . To purchase Oxy credits separately, compare the options in{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="https://console.oxy.so/billing/plans"
            >
              Oxy Console
            </Link>
            . If you are building with AI models, go directly to{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/ai/pricing/"
            >
              inference pricing
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    title: 'Oxy One',
    items: [
      {
        question: 'What is Oxy One?',
        answer: (
          <>
            Oxy One bundles subscriptions from Oxy apps into one plan, with a monthly credit
            allowance for AI and API usage. Choose Personal, Creator or Business according to the
            apps and usage you need.
          </>
        ),
      },
      {
        question: 'What does Oxy One include?',
        answer:
          'Each paid Oxy One plan combines app subscriptions and a monthly credit allowance. The app subscriptions and usage included depend on your plan. You can also subscribe to an app separately if that is all you need.',
      },
      {
        question: 'How much does Oxy One cost, and can I subscribe?',
        answer: (
          <>
            Check the{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/one/"
            >
              current Oxy One offer
            </Link>{' '}
            for its price, billing terms and purchase availability. Annual billing saves 20%
            compared with twelve monthly payments. The annual view shows the monthly equivalent and
            the full amount billed for the year. Creator offers Go, Pro, Max and Ultra, with monthly
            and annual billing.
          </>
        ),
      },
      {
        question: 'Does my plan include credits?',
        answer:
          'Yes. Paid Oxy One plans include a monthly credit allowance. AI activity in apps such as Alia and calls to the Oxy API consume credits. You can buy extra credits if you need more than your included allowance.',
      },
    ],
  },
  {
    title: 'Credits & discounts',
    items: [
      {
        question: 'What are credits used for?',
        answer:
          'Credits pay for AI usage in Oxy apps, including Alia, and for calls to the Oxy API. Usage reduces your balance. The amount consumed depends on the model and the work performed; a credit is not a fixed number of messages.',
      },
      {
        question: 'What happens when I run out of credits?',
        answer:
          'Credit-consuming AI and API usage stops when the available balance reaches zero. You can top up to continue, or wait for your next included allowance. Running out of credits does not remove your account or your non-AI app benefits.',
      },
      {
        question: 'Can I subscribe to an app without Oxy One?',
        answer:
          'Yes. Oxy apps can have their own subscriptions. Oxy One combines selected app subscriptions into a single package, so you can choose an individual app plan or a bundle according to what you use.',
      },
      {
        question: 'How does my plan affect credit pack prices?',
        answer: (
          <>
            Your plan includes monthly credits. If you need more, you can purchase a top-up.
            Personal top-up discounts are{' '}
            {Object.entries(OXY_ONE_PERSONAL_PLANS)
              .map(([plan, { creditDiscount: discount }]) => `${plan} ${discount}%`)
              .join(', ')}
            . Business discounts are{' '}
            {Object.entries(OXY_ONE_BUSINESS_PLANS)
              .map(([plan, { creditDiscount }]) => `${plan} ${creditDiscount}%`)
              .join(', ')}
            . Creator discounts are{' '}
            {Object.entries(OXY_ONE_CREATOR_PLANS)
              .map(([plan, { creditDiscount }]) => `${plan} ${creditDiscount}%`)
              .join(', ')}
            . These discounts apply to extra credit purchases, on top of your monthly allowance.
          </>
        ),
      },
      {
        question: 'Can I add credits without a monthly subscription?',
        answer: (
          <>
            Yes. You can purchase credits without an Oxy One subscription. For regular usage, a
            subscription combines a monthly allowance with app benefits; top-ups provide extra usage
            when you need it. Open{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="https://console.oxy.so/billing/plans"
            >
              account billing
            </Link>{' '}
            to review the available options and checkout details.
          </>
        ),
      },
    ],
  },
  {
    title: 'Purchases & account management',
    items: [
      {
        question: 'Where do I buy or manage a plan?',
        answer: (
          <>
            Manage Oxy credit plans in{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="https://console.oxy.so/billing/plans"
            >
              Oxy Console
            </Link>
            . For personal account payments and Oxy One, use{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="https://accounts.oxy.so/payments"
            >
              Oxy Accounts
            </Link>
            . This website helps you compare the options and takes you to the appropriate account
            page.
          </>
        ),
      },
      {
        question: 'Can anyone pay for ads or more visibility?',
        answer:
          'No. Oxy is 100% ad-free, including on Free. We do not sell ads, sponsored placement, boosts or organic reach. Subscriptions pay for additional tools and capacity, never verification, reputation or preferential moderation. Existing free tools, security and data export stay free.',
      },
      {
        question: 'Can I pay for a verified badge?',
        answer:
          'No. Verified badges are not sold or included in paid plans. Anyone can apply for verification; it is awarded to real people of public relevance based on authenticity and notability. A paid subscription is not required.',
      },
      {
        question: 'Can I cancel a monthly credit plan?',
        answer:
          'Yes. Cancellation of an Oxy credit subscription takes effect at the end of the current billing period, so it remains active until that period closes. Manage the subscription through the account that purchased it. Other product subscriptions have their own terms.',
      },
      {
        question: 'Where can I get help with billing?',
        answer: (
          <>
            Start with the billing page for the product you purchased, where you can identify the
            plan and account involved. If you still need help, visit the{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/help/"
            >
              help center
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    title: 'AI & other products',
    items: [
      {
        question: 'Where can I compare AI inference prices?',
        answer: (
          <>
            The{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/ai/pricing/"
            >
              inference pricing page
            </Link>{' '}
            lists model-specific usage prices and units. Use it to compare the models you intend to
            call; account credit plans are not a per-model rate card.
          </>
        ),
      },
      {
        question: 'Where are standalone Alia plans?',
        answer: (
          <>
            Standalone Alia subscriptions are listed on{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="https://alia.onl/pricing"
            >
              Alia’s pricing page
            </Link>
            . If you are considering Alia as part of Oxy One, compare the Alia benefits in the One
            offer before choosing.
          </>
        ),
      },
      {
        question: 'What if my organisation needs dedicated inference capacity?',
        answer: (
          <>
            Dedicated inference is a separate offering.{' '}
            <Link
              className="text-primary-text underline underline-offset-4 hover:text-foreground"
              to="/contact/sales/?interest=dedicated_inference"
            >
              Talk to sales
            </Link>{' '}
            about your workload, capacity requirements and deployment needs.
          </>
        ),
      },
    ],
  },
] satisfies readonly FaqGroup[];

const FAMILY_FAQ_GROUP: FaqGroup = {
  title: 'Oxy One for your family',
  items: [
    {
      question: 'How many people does Family include?',
      answer: `One Family plan covers up to ${OXY_ONE_FAMILY_MEMBERS} people in total, including the organizer. The price is for the whole family, not per person. Creating or joining a family remains free.`,
    },
    {
      question: 'Does everyone get the displayed credit allowance?',
      answer:
        'The displayed allowance is one monthly pool shared by the family, not a separate allowance for each member. Annual billing changes the payment schedule; credits still renew monthly.',
    },
    {
      question: 'Can my family see my conversations or files?',
      answer:
        'Sharing a plan does not share your private account, conversations or files. Family membership is separate from permission to access someone else’s content.',
    },
    {
      question: 'What if I belong to more than one family?',
      answer:
        'Oxy supports membership in multiple families. A Family subscription belongs to the family it was purchased for; belonging to several families does not multiply that subscription’s credit allowance.',
    },
    {
      question: 'Are Family benefits ready to activate?',
      answer:
        'Family groups already exist in Oxy. Shared subscription billing and benefits still need to be connected. You can compare the Family plans here; activation will be offered in Oxy Accounts when supported.',
    },
  ],
};

/** Keep billing guidance relevant to the audience selected above the catalogue. */
export function getAudienceFaqGroups(
  audience: 'personal' | 'creator' | 'business',
  mode: PersonalPlanMode = 'individual',
): readonly FaqGroup[] {
  if (audience === 'personal')
    return [
      ...(mode === 'family' ? [FAMILY_FAQ_GROUP] : []),
      ...PRICING_FAQ_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.question !== 'How do I get a price for Creator?' &&
            item.question !== 'What if my organisation needs dedicated inference capacity?',
        ),
      })),
    ];
  const creator = audience === 'creator';
  const name = creator ? 'Creator' : 'Business';
  return [
    {
      title: `Oxy One for ${creator ? 'creators' : 'businesses'}`,
      items: [
        {
          question: `Who is the ${name} plan for?`,
          answer: creator
            ? 'Creator Go, Pro, Max and Ultra are for people who create and share with Oxy. Compare publishing tools, analytics, image and video generation, and AI usage to choose your plan.'
            : 'Business Go, Pro, Max and Ultra are for organisations working with Oxy. Compare the monthly or annual prices and credit discounts above to choose your plan.',
        },
        {
          question: `How is ${name} billed?`,
          answer:
            'Choose monthly billing or save 20% with annual billing. The annual view shows the monthly equivalent and the full amount charged for the year. Credit allowances renew monthly even when you pay annually.',
        },
        ...(!creator
          ? [
              {
                question: 'Does Business include both Mercaria and Homiio?',
                answer:
                  'Business combines Alia, Mention and Inbox with one app for your business: choose Mercaria for selling products or Homiio for housing. One choice is included for the team, not both. The plan grid shows both options together; subscription activation is managed in Oxy Accounts.',
              },
              {
                question: 'How do the base fee and seats work?',
                answer: `Your total is the team base fee plus the per-user price multiplied by the number of members. Every member needs a paid seat; seats are not included in the base fee. For example, Business Go with five members costs ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((OXY_ONE_BUSINESS_PLANS.Go.monthlyPrice + 5 * OXY_ONE_BUSINESS_PLANS.Go.monthlySeatPrice) / 100)} per month. Annual billing saves 20% on both the base fee and the seats. Monthly credits are also calculated as a base allowance plus the allowance for each active seat, shared by the team.`,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Credits & discounts',
      items: [
        {
          question: `What credit discount does ${name} include?`,
          answer: `${`${name} credit pack discounts are ${Object.entries(
            creator ? OXY_ONE_CREATOR_PLANS : OXY_ONE_BUSINESS_PLANS,
          )
            .map(([tier, plan]) => `${tier} ${plan.creditDiscount}%`)
            .join(
              ', ',
            )}.`} These discounts apply to extra credits purchased on top of the monthly credits included with your plan.`,
        },
        {
          question: 'Can I use my credits in Alia and through the API?',
          answer:
            'Yes. Credits cover AI usage in Alia and calls to the Oxy API. Both draw from the available credit allowance for the account being used.',
        },
      ],
    },
    {
      title: 'Purchases & support',
      items: PRICING_FAQ_GROUPS[3].items.filter(
        (item) =>
          item.question === 'Where do I buy or manage a plan?' ||
          item.question === 'Where can I get help with billing?' ||
          item.question === 'Can I pay for a verified badge?' ||
          item.question === 'Can anyone pay for ads or more visibility?',
      ),
    },
    ...(!creator
      ? [{ title: 'Dedicated infrastructure', items: [PRICING_FAQ_GROUPS[4].items[2]] }]
      : []),
  ];
}
