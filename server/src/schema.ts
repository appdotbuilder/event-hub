import { z } from 'zod';

// User schema with proper field handling
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(), // Stored as hashed password in DB
  created_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users (signup)
export const createUserInputSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Response schema for successful user creation (excluding password hash)
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type UserResponse = z.infer<typeof userResponseSchema>;