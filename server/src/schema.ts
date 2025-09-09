import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['event_organizer', 'administrator']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  subscription_status: z.string().nullable(),
  is_active: z.boolean(),
  upload_rate_limit: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Theme schema for events
export const eventThemeSchema = z.object({
  id: z.number(),
  name: z.string(),
  is_standard: z.boolean(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type EventTheme = z.infer<typeof eventThemeSchema>;

// Event schema
export const eventSchema = z.object({
  id: z.number(),
  organizer_id: z.number(),
  name: z.string(),
  topic: z.string().nullable(),
  text_color: z.string().nullable(),
  theme_id: z.number().nullable(),
  custom_theme_image_url: z.string().nullable(),
  event_date: z.coerce.date(),
  event_time: z.string().nullable(),
  address: z.string().nullable(),
  postcode: z.string().nullable(),
  city: z.string().nullable(),
  thank_you_message: z.string().nullable(),
  qr_code_token: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Event = z.infer<typeof eventSchema>;

// Event program entry schema
export const eventProgramSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  topic: z.string(),
  time: z.string(),
  order_index: z.number().int(),
  created_at: z.coerce.date()
});

export type EventProgram = z.infer<typeof eventProgramSchema>;

// Contact person schema
export const contactPersonSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  name: z.string(),
  phone_number: z.string().nullable(),
  email: z.string().email().nullable(),
  is_contact_person: z.boolean(),
  created_at: z.coerce.date()
});

export type ContactPerson = z.infer<typeof contactPersonSchema>;

// Guest upload schema
export const guestUploadSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  guest_name: z.string(),
  file_url: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  is_favorited: z.boolean(),
  upload_ip: z.string().nullable(),
  created_at: z.coerce.date()
});

export type GuestUpload = z.infer<typeof guestUploadSchema>;

// Input schemas for creating entities

// Create user input
export const createUserInputSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema,
  subscription_status: z.string().nullable().optional(),
  upload_rate_limit: z.number().int().optional().default(10)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Update user input
export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  subscription_status: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  upload_rate_limit: z.number().int().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Create event theme input
export const createEventThemeInputSchema = z.object({
  name: z.string(),
  is_standard: z.boolean().optional().default(false),
  image_url: z.string().nullable().optional()
});

export type CreateEventThemeInput = z.infer<typeof createEventThemeInputSchema>;

// Create event input
export const createEventInputSchema = z.object({
  name: z.string(),
  topic: z.string().nullable().optional(),
  text_color: z.string().nullable().optional(),
  theme_id: z.number().nullable().optional(),
  custom_theme_image_url: z.string().nullable().optional(),
  event_date: z.coerce.date(),
  event_time: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  thank_you_message: z.string().nullable().optional()
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

// Update event input
export const updateEventInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  topic: z.string().nullable().optional(),
  text_color: z.string().nullable().optional(),
  theme_id: z.number().nullable().optional(),
  custom_theme_image_url: z.string().nullable().optional(),
  event_date: z.coerce.date().optional(),
  event_time: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  thank_you_message: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateEventInput = z.infer<typeof updateEventInputSchema>;

// Create event program input
export const createEventProgramInputSchema = z.object({
  event_id: z.number(),
  topic: z.string(),
  time: z.string(),
  order_index: z.number().int()
});

export type CreateEventProgramInput = z.infer<typeof createEventProgramInputSchema>;

// Update event program input
export const updateEventProgramInputSchema = z.object({
  id: z.number(),
  topic: z.string().optional(),
  time: z.string().optional(),
  order_index: z.number().int().optional()
});

export type UpdateEventProgramInput = z.infer<typeof updateEventProgramInputSchema>;

// Create contact person input
export const createContactPersonInputSchema = z.object({
  event_id: z.number(),
  name: z.string(),
  phone_number: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  is_contact_person: z.boolean().optional().default(false)
});

export type CreateContactPersonInput = z.infer<typeof createContactPersonInputSchema>;

// Update contact person input
export const updateContactPersonInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  phone_number: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  is_contact_person: z.boolean().optional()
});

export type UpdateContactPersonInput = z.infer<typeof updateContactPersonInputSchema>;

// Guest upload input
export const guestUploadInputSchema = z.object({
  event_id: z.number(),
  guest_name: z.string(),
  file_url: z.string(),
  file_name: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  upload_ip: z.string().nullable().optional()
});

export type GuestUploadInput = z.infer<typeof guestUploadInputSchema>;

// Update guest upload input (for favoriting, etc.)
export const updateGuestUploadInputSchema = z.object({
  id: z.number(),
  is_favorited: z.boolean().optional()
});

export type UpdateGuestUploadInput = z.infer<typeof updateGuestUploadInputSchema>;

// Public event access input (by QR token)
export const getEventByTokenInputSchema = z.object({
  qr_code_token: z.string()
});

export type GetEventByTokenInput = z.infer<typeof getEventByTokenInputSchema>;

// Generic ID input for delete operations
export const deleteByIdInputSchema = z.object({
  id: z.number()
});

export type DeleteByIdInput = z.infer<typeof deleteByIdInputSchema>;

// Get events by organizer input
export const getEventsByOrganizerInputSchema = z.object({
  organizer_id: z.number()
});

export type GetEventsByOrganizerInput = z.infer<typeof getEventsByOrganizerInputSchema>;

// Get uploads by event input
export const getUploadsByEventInputSchema = z.object({
  event_id: z.number()
});

export type GetUploadsByEventInput = z.infer<typeof getUploadsByEventInputSchema>;

// Authentication schema
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const authResponseSchema = z.object({
  success: z.boolean(),
  user: userSchema.optional(),
  token: z.string().optional(),
  message: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Additional input schemas for specific operations
export const reorderProgramsInputSchema = z.object({
  eventId: z.number(),
  programIds: z.array(z.number())
});

export type ReorderProgramsInput = z.infer<typeof reorderProgramsInputSchema>;

export const checkRateLimitInputSchema = z.object({
  eventId: z.number(),
  uploadIp: z.string()
});

export type CheckRateLimitInput = z.infer<typeof checkRateLimitInputSchema>;