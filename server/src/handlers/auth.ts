import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse, type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';


// Simple hash function for passwords (in production, use bcrypt)
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password + 'salt').digest('hex');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

// Generate simple token (in production, use JWT with proper signing)
const generateToken = (userId: number): string => {
  const payload = JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 });
  return Buffer.from(payload).toString('base64');
};

export async function login(input: LoginInput): Promise<AuthResponse> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        message: 'Account is inactive'
      };
    }

    // Verify password
    if (!verifyPassword(input.password, user.password_hash)) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }

    // Generate token
    const token = generateToken(user.id);

    // Return success response with user data and token
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        subscription_status: user.subscription_status,
        is_active: user.is_active,
        upload_rate_limit: user.upload_rate_limit,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token,
      message: 'Login successful'
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Check if user with email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = hashPassword(input.password);

    // Create user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        password_hash: passwordHash,
        role: input.role,
        subscription_status: input.subscription_status || null,
        upload_rate_limit: input.upload_rate_limit || 10
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}

export async function getCurrentUser(userId: number): Promise<User | null> {
  try {
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}