import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['event_organizer', 'administrator']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  subscription_status: text('subscription_status'), // Nullable for different subscription states
  is_active: boolean('is_active').default(true).notNull(),
  upload_rate_limit: integer('upload_rate_limit').default(10).notNull(), // Images per minute
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Event themes table (standard and custom themes)
export const eventThemesTable = pgTable('event_themes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  is_standard: boolean('is_standard').default(false).notNull(), // True for predefined themes
  image_url: text('image_url'), // URL to theme image
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Events table
export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  organizer_id: integer('organizer_id').references(() => usersTable.id).notNull(),
  name: text('name').notNull(),
  topic: text('topic'), // Optional topic/description
  text_color: text('text_color'), // Color for event text display
  theme_id: integer('theme_id').references(() => eventThemesTable.id), // Reference to theme
  custom_theme_image_url: text('custom_theme_image_url'), // Custom uploaded theme image
  event_date: timestamp('event_date').notNull(),
  event_time: text('event_time'), // Store as text for flexible time formats
  address: text('address'),
  postcode: text('postcode'),
  city: text('city'),
  thank_you_message: text('thank_you_message'), // Optional thank you message for guests
  qr_code_token: text('qr_code_token').notNull().unique(), // Unique token for QR code access
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Event program entries table
export const eventProgramsTable = pgTable('event_programs', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => eventsTable.id).notNull(),
  topic: text('topic').notNull(), // Program entry topic
  time: text('time').notNull(), // Time for this program entry
  order_index: integer('order_index').notNull(), // Order in the program
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Contact persons table
export const contactPersonsTable = pgTable('contact_persons', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => eventsTable.id).notNull(),
  name: text('name').notNull(),
  phone_number: text('phone_number'),
  email: text('email'),
  is_contact_person: boolean('is_contact_person').default(false).notNull(), // Mark as designated contact
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Guest uploads table
export const guestUploadsTable = pgTable('guest_uploads', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => eventsTable.id).notNull(),
  guest_name: text('guest_name').notNull(), // Name provided by guest
  file_url: text('file_url').notNull(), // URL to uploaded file
  file_name: text('file_name').notNull(),
  file_size: integer('file_size').notNull(), // File size in bytes
  mime_type: text('mime_type').notNull(), // File MIME type
  is_favorited: boolean('is_favorited').default(false).notNull(), // Favorited by organizer
  upload_ip: text('upload_ip'), // Track upload IP for rate limiting
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  events: many(eventsTable),
}));

export const eventsRelations = relations(eventsTable, ({ one, many }) => ({
  organizer: one(usersTable, {
    fields: [eventsTable.organizer_id],
    references: [usersTable.id],
  }),
  theme: one(eventThemesTable, {
    fields: [eventsTable.theme_id],
    references: [eventThemesTable.id],
  }),
  programs: many(eventProgramsTable),
  contactPersons: many(contactPersonsTable),
  uploads: many(guestUploadsTable),
}));

export const eventThemesRelations = relations(eventThemesTable, ({ many }) => ({
  events: many(eventsTable),
}));

export const eventProgramsRelations = relations(eventProgramsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [eventProgramsTable.event_id],
    references: [eventsTable.id],
  }),
}));

export const contactPersonsRelations = relations(contactPersonsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [contactPersonsTable.event_id],
    references: [eventsTable.id],
  }),
}));

export const guestUploadsRelations = relations(guestUploadsTable, ({ one }) => ({
  event: one(eventsTable, {
    fields: [guestUploadsTable.event_id],
    references: [eventsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type EventTheme = typeof eventThemesTable.$inferSelect;
export type NewEventTheme = typeof eventThemesTable.$inferInsert;

export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;

export type EventProgram = typeof eventProgramsTable.$inferSelect;
export type NewEventProgram = typeof eventProgramsTable.$inferInsert;

export type ContactPerson = typeof contactPersonsTable.$inferSelect;
export type NewContactPerson = typeof contactPersonsTable.$inferInsert;

export type GuestUpload = typeof guestUploadsTable.$inferSelect;
export type NewGuestUpload = typeof guestUploadsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  eventThemes: eventThemesTable,
  events: eventsTable,
  eventPrograms: eventProgramsTable,
  contactPersons: contactPersonsTable,
  guestUploads: guestUploadsTable,
};

export const allRelations = {
  usersRelations,
  eventsRelations,
  eventThemesRelations,
  eventProgramsRelations,
  contactPersonsRelations,
  guestUploadsRelations,
};