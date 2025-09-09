import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type LoginInput } from '../schema';
import { createUser, login, getCurrentUser } from '../handlers/auth';
import { eq } from 'drizzle-orm';

const testUserInput: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  role: 'event_organizer',
  subscription_status: 'active',
  upload_rate_limit: 15
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('Authentication Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await createUser(testUserInput);

      // Verify user properties
      expect(result.username).toEqual('testuser');
      expect(result.email).toEqual('test@example.com');
      expect(result.role).toEqual('event_organizer');
      expect(result.subscription_status).toEqual('active');
      expect(result.upload_rate_limit).toEqual(15);
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.password_hash).not.toEqual('testpassword123'); // Should be hashed
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].email).toEqual('test@example.com');
      expect(users[0].role).toEqual('event_organizer');
      expect(users[0].is_active).toEqual(true);
    });

    it('should apply default values correctly', async () => {
      const minimalInput: CreateUserInput = {
        username: 'minimal',
        email: 'minimal@example.com',
        password: 'password123',
        role: 'administrator',
        upload_rate_limit: 10
      };

      const result = await createUser(minimalInput);

      expect(result.subscription_status).toBeNull();
      expect(result.upload_rate_limit).toEqual(10); // Default value
      expect(result.is_active).toEqual(true);
    });

    it('should prevent duplicate email registration', async () => {
      // Create first user
      await createUser(testUserInput);

      // Try to create another user with same email
      const duplicateInput: CreateUserInput = {
        ...testUserInput,
        username: 'different'
      };

      await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await createUser(testUserInput);
    });

    it('should successfully log in with correct credentials', async () => {
      const result = await login(testLoginInput);

      expect(result.success).toEqual(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.message).toEqual('Login successful');
      
      if (result.user) {
        expect(result.user.email).toEqual('test@example.com');
        expect(result.user.username).toEqual('testuser');
        expect(result.user.role).toEqual('event_organizer');
      }
    });

    it('should fail login with incorrect email', async () => {
      const wrongEmailInput: LoginInput = {
        email: 'wrong@example.com',
        password: 'testpassword123'
      };

      const result = await login(wrongEmailInput);

      expect(result.success).toEqual(false);
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
      expect(result.message).toEqual('Invalid email or password');
    });

    it('should fail login with incorrect password', async () => {
      const wrongPasswordInput: LoginInput = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const result = await login(wrongPasswordInput);

      expect(result.success).toEqual(false);
      expect(result.user).toBeUndefined();
      expect(result.token).toBeUndefined();
      expect(result.message).toEqual('Invalid email or password');
    });

    it('should fail login for inactive user', async () => {
      // Create user and deactivate them
      const user = await createUser({
        ...testUserInput,
        email: 'inactive@example.com'
      });

      await db.update(usersTable)
        .set({ is_active: false })
        .where(eq(usersTable.id, user.id))
        .execute();

      const inactiveLoginInput: LoginInput = {
        email: 'inactive@example.com',
        password: 'testpassword123'
      };

      const result = await login(inactiveLoginInput);

      expect(result.success).toEqual(false);
      expect(result.message).toEqual('Account is inactive');
    });

    it('should generate valid JWT token', async () => {
      const result = await login(testLoginInput);

      expect(result.success).toEqual(true);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toEqual('string');
      expect(result.token!.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data for existing user', async () => {
      const createdUser = await createUser(testUserInput);
      const result = await getCurrentUser(createdUser.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(createdUser.id);
      expect(result!.username).toEqual('testuser');
      expect(result!.email).toEqual('test@example.com');
      expect(result!.role).toEqual('event_organizer');
    });

    it('should return null for non-existent user', async () => {
      const result = await getCurrentUser(99999);

      expect(result).toBeNull();
    });

    it('should return complete user object with all fields', async () => {
      const createdUser = await createUser(testUserInput);
      const result = await getCurrentUser(createdUser.id);

      expect(result).toBeDefined();
      expect(result!.id).toBeDefined();
      expect(result!.username).toBeDefined();
      expect(result!.email).toBeDefined();
      expect(result!.password_hash).toBeDefined();
      expect(result!.role).toBeDefined();
      expect(result!.subscription_status).toBeDefined();
      expect(result!.is_active).toBeDefined();
      expect(result!.upload_rate_limit).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('Password hashing', () => {
    it('should hash passwords consistently', async () => {
      const user1 = await createUser({
        ...testUserInput,
        email: 'user1@example.com'
      });

      const user2 = await createUser({
        ...testUserInput,
        email: 'user2@example.com'
      });

      // Same password should result in same hash
      expect(user1.password_hash).toEqual(user2.password_hash);
      expect(user1.password_hash).not.toEqual('testpassword123');
    });

    it('should verify password correctly during login', async () => {
      await createUser(testUserInput);

      // Correct password should work
      const validLogin = await login(testLoginInput);
      expect(validLogin.success).toEqual(true);

      // Wrong password should fail
      const invalidLogin = await login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      expect(invalidLogin.success).toEqual(false);
    });
  });
});