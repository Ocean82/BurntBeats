


// License Acknowledgments Table
export const licenseAcknowledgments = pgTable('license_acknowledgments', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  trackId: varchar('track_id', { length: 255 }).notNull(),
  acceptedAt: timestamp('accepted_at').defaultNow().notNull(),
  purchaseId: varchar('purchase_id', { length: 255 }), // Optional Stripe session ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type LicenseAcknowledgment = typeof licenseAcknowledgments.$inferSelect;
export type NewLicenseAcknowledgment = typeof licenseAcknowledgments.$inferInsert;
