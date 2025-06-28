
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const licenseAcknowledgments = pgTable('license_acknowledgments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  trackId: text('track_id').notNull(),
  acceptedAt: timestamp('accepted_at').notNull(),
  purchaseId: text('purchase_id'), // Optional: link to Stripe session
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const selectLicenseAcknowledgmentSchema = createSelectSchema(licenseAcknowledgments);
export const insertLicenseAcknowledgmentSchema = createInsertSchema(licenseAcknowledgments);

export type LicenseAcknowledgment = z.infer<typeof selectLicenseAcknowledgmentSchema>;
export type NewLicenseAcknowledgment = z.infer<typeof insertLicenseAcknowledgmentSchema>;
