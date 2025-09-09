import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(), // Store hashed passwords only
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type User = typeof usersTable.$inferSelect; // For SELECT operations
export type NewUser = typeof usersTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { users: usersTable };