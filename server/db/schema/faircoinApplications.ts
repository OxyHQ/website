import { boolean, index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import type { FaircoinApplicationStatus } from '../../contracts/faircoinApplication.js';
import { objectId, timestamps } from './columns.js';

/** Private interest only: no wallet, offer, public contact or publication permission. */
export const faircoinApplications = pgTable(
  'faircoin_applications',
  {
    _id: objectId(),
    projectName: text().notNull(),
    website: text().notNull(),
    contactName: text().notNull(),
    contactEmail: text().notNull(),
    offering: text().notNull(),
    needs: text().notNull(),
    capacity: text().notNull(),
    availability: text().notNull(),
    modality: text().$type<'remote' | 'local' | 'both'>().notNull(),
    location: text().notNull(),
    conditions: text().notNull(),
    contactConsentAt: timestamp({ withTimezone: true }).notNull(),
    updatesConsent: boolean().notNull().default(false),
    status: text().$type<FaircoinApplicationStatus>().notNull().default('submitted'),
    statusChangedBy: text(),
    statusChangedAt: timestamp({ withTimezone: true }),
    internalNote: text(),
    keyHash: text().notNull(),
    requestHash: text().notNull(),
    deleteAfter: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('faircoin_applications_key_idx').on(table.keyHash),
    index('faircoin_applications_expiry_idx').on(table.deleteAfter),
    index('faircoin_applications_status_idx').on(table.status, table._id),
  ],
);
