


// License Acknowledgments Table
export const licenseAcknowledgments = pgTable('license_acknowledgments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  trackId: text('track_id').notNull(),
  acceptedAt: timestamp('accepted_at').notNull(),
  purchaseId: text('purchase_id'), // Optional Stripe session ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type LicenseAcknowledgment = typeof licenseAcknowledgments.$inferSelect;
export type NewLicenseAcknowledgment = typeof licenseAcknowledgments.$inferInsert;
