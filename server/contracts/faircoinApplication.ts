import { z } from 'zod';

/** Shared by the public form and API. Applications are private, never offers. */
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !value.includes('\0'));
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !value.includes('\0'))
    .default('');

export const faircoinApplicationSchema = z
  .strictObject({
    projectName: text(160),
    website: optionalText(500).refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
      } catch {
        return false;
      }
    }),
    contactName: text(120),
    contactEmail: z.string().trim().toLowerCase().email().max(254),
    offering: text(2000),
    needs: text(2000),
    capacity: text(1000),
    availability: text(1000),
    modality: z.enum(['remote', 'local', 'both']),
    location: optionalText(160),
    conditions: text(2000),
    contactConsent: z.literal(true),
    updatesConsent: z.boolean().default(false),
    // A bot trap, not an extra project URL. Never persisted.
    website_confirm: z.string().max(500).default(''),
  })
  .superRefine((input, context) => {
    if (input.modality !== 'remote' && !input.location) {
      context.addIssue({ code: 'custom', path: ['location'], message: 'Location required' });
    }
  });

export type FaircoinApplicationInput = z.infer<typeof faircoinApplicationSchema>;

export const faircoinParticipationStatusSchema = z
  .strictObject({
    state: z.literal('preparation'),
    acceptingApplications: z.boolean(),
    retentionDays: z.number().int().min(1).max(365).nullable(),
    privacyContact: z.string().email().nullable(),
  })
  .refine(
    (status) =>
      !status.acceptingApplications ||
      (status.retentionDays !== null && status.privacyContact !== null),
    'Open intake requires retention and a privacy contact',
  );
export type FaircoinParticipationStatus = z.infer<typeof faircoinParticipationStatusSchema>;

export const faircoinApplicationReceiptSchema = z.strictObject({
  id: z.string().regex(/^[a-f0-9]{24}$/),
  status: z.literal('received'),
  submittedAt: z.iso.datetime(),
  deleteAfter: z.iso.datetime(),
});
export type FaircoinApplicationReceipt = z.infer<typeof faircoinApplicationReceiptSchema>;

export const FAIRCOIN_APPLICATION_STATUSES = [
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'closed',
] as const;
export type FaircoinApplicationStatus = (typeof FAIRCOIN_APPLICATION_STATUSES)[number];

/** Approval records interest only. Publication needs a separate, consented offer. */
export const FAIRCOIN_APPLICATION_TRANSITIONS: Record<
  FaircoinApplicationStatus,
  readonly FaircoinApplicationStatus[]
> = {
  submitted: ['in_review', 'closed'],
  in_review: ['approved', 'rejected', 'closed'],
  approved: ['in_review', 'closed'],
  rejected: ['in_review', 'closed'],
  closed: [],
};
