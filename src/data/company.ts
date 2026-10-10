/* ─────────────────────────────────────────────
   Company page — static content constants.
   Same pattern as codea.ts / inbox.ts / ai.ts.
   Content sourced from https://oxy.so/company
   ───────────────────────────────────────────── */

export interface FAQItem {
  question: string;
  answer: string;
}

/* ── FAQ ── */

export const companyFAQ: FAQItem[] = [
  {
    question: 'Can I contribute to Oxy without being an employee?',
    answer:
      'Absolutely. Oxy is open source and community-driven. You can contribute code, report bugs, write documentation, or join discussions on our GitHub and community channels.',
  },
  {
    question: 'How do I stay in the loop on what Oxy is building?',
    answer:
      'Follow our engineering blog, subscribe to the changelog, and join our community on social media. We share updates regularly.',
  },
  {
    question: "What's it actually like to work at Oxy?",
    answer:
      'We are remote-first, async-friendly, and value autonomy. Our team members have unlimited time off, flexible schedules, and a culture built on trust.',
  },
  {
    question: "What does Oxy's hiring process look like?",
    answer:
      'Typically: application review, an introductory call, a technical or portfolio review, and a team conversation. We keep it straightforward and respectful of your time.',
  },
  {
    question: 'How do I apply for a role at Oxy?',
    answer:
      "Visit our careers page to see open roles. You can apply directly or reach out to us if you don't see a perfect fit but want to connect.",
  },
  {
    question: 'Any tips for preparing for an Oxy interview?',
    answer:
      'Be yourself. Familiarize yourself with our products and values. We care about how you think and communicate, not just technical skills.',
  },
  {
    question: 'Does Oxy offer internships?',
    answer:
      'Yes, we offer internships for students and early-career professionals. Check our careers page for current openings.',
  },
];
