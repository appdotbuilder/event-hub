import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, eventsTable, guestUploadsTable, eventProgramsTable, contactPersonsTable } from '../db/schema';
import { type UpdateUserInput, type DeleteByIdInput } from '../schema';
import { getAllUsers, getUserById, updateUser, deleteUser, deactivateUser } from '../handlers/users';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  role: 'event_organizer' as const,
  subscription_status: 'premium',
  is_active: true,
  upload_rate_limit: 20
};

const testUser2 = {
  username: 'testuser2',
  email: 'test2@example.com',
  password_hash: 'hashedpassword2',
  role: 'administrator' as const,
  subscription_status: null,
  is_active: true,
  upload_rate_limit: 10
};

describe('User Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Create test users
      const users = await db.insert(usersTable)
        .values([testUser, testUser2])
        .returning()
        .execute();

      const result = await getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].username).toEqual('testuser');
      expect(result[0].email).toEqual('test@example.com');
      expect(result[0].role).toEqual('event_organizer');
      expect(result[0].subscription_status).toEqual('premium');
      expect(result[0].is_active).toBe(true);
      expect(result[0].upload_rate_limit).toEqual(20);

      expect(result[1].username).toEqual('testuser2');
      expect(result[1].role).toEqual('administrator');
      expect(result[1].subscription_status).toBeNull();
    });

    it('should return empty array when no users exist', async () => {
      const result = await getAllUsers();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const result = await getUserById(createdUser.id);

      expect(result).toBeTruthy();
      expect(result!.id).toEqual(createdUser.id);
      expect(result!.username).toEqual('testuser');
      expect(result!.email).toEqual('test@example.com');
      expect(result!.role).toEqual('event_organizer');
      expect(result!.subscription_status).toEqual('premium');
      expect(result!.is_active).toBe(true);
      expect(result!.upload_rate_limit).toEqual(20);
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null when user does not exist', async () => {
      const result = await getUserById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user with provided fields', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        username: 'updateduser',
        email: 'updated@example.com',
        subscription_status: 'basic',
        is_active: false,
        upload_rate_limit: 5
      };

      const result = await updateUser(updateInput);

      expect(result.id).toEqual(createdUser.id);
      expect(result.username).toEqual('updateduser');
      expect(result.email).toEqual('updated@example.com');
      expect(result.subscription_status).toEqual('basic');
      expect(result.is_active).toBe(false);
      expect(result.upload_rate_limit).toEqual(5);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should update only provided fields', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        username: 'partialupdate'
      };

      const result = await updateUser(updateInput);

      expect(result.username).toEqual('partialupdate');
      expect(result.email).toEqual('test@example.com'); // Original value
      expect(result.subscription_status).toEqual('premium'); // Original value
      expect(result.is_active).toBe(true); // Original value
    });

    it('should update subscription status to null', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        subscription_status: null
      };

      const result = await updateUser(updateInput);

      expect(result.subscription_status).toBeNull();
    });

    it('should throw error when user does not exist', async () => {
      const updateInput: UpdateUserInput = {
        id: 999,
        username: 'nonexistent'
      };

      await expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
    });

    it('should save changes to database', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const updateInput: UpdateUserInput = {
        id: createdUser.id,
        username: 'dbtest'
      };

      await updateUser(updateInput);

      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(dbUser[0].username).toEqual('dbtest');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const deleteInput: DeleteByIdInput = {
        id: createdUser.id
      };

      const result = await deleteUser(deleteInput);

      expect(result.success).toBe(true);

      // Verify user is deleted from database
      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(dbUser).toHaveLength(0);
    });

    it('should cascade delete all user related data', async () => {
      // Create user
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      // Create event for user
      const [event] = await db.insert(eventsTable)
        .values({
          organizer_id: createdUser.id,
          name: 'Test Event',
          event_date: new Date(),
          qr_code_token: 'test-token-123'
        })
        .returning()
        .execute();

      // Create related data
      await db.insert(eventProgramsTable)
        .values({
          event_id: event.id,
          topic: 'Test Program',
          time: '10:00',
          order_index: 1
        })
        .execute();

      await db.insert(contactPersonsTable)
        .values({
          event_id: event.id,
          name: 'Test Contact',
          is_contact_person: true
        })
        .execute();

      await db.insert(guestUploadsTable)
        .values({
          event_id: event.id,
          guest_name: 'Test Guest',
          file_url: 'http://example.com/file.jpg',
          file_name: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
        .execute();

      const deleteInput: DeleteByIdInput = {
        id: createdUser.id
      };

      const result = await deleteUser(deleteInput);

      expect(result.success).toBe(true);

      // Verify all related data is deleted
      const uploads = await db.select()
        .from(guestUploadsTable)
        .where(eq(guestUploadsTable.event_id, event.id))
        .execute();
      expect(uploads).toHaveLength(0);

      const contacts = await db.select()
        .from(contactPersonsTable)
        .where(eq(contactPersonsTable.event_id, event.id))
        .execute();
      expect(contacts).toHaveLength(0);

      const programs = await db.select()
        .from(eventProgramsTable)
        .where(eq(eventProgramsTable.event_id, event.id))
        .execute();
      expect(programs).toHaveLength(0);

      const events = await db.select()
        .from(eventsTable)
        .where(eq(eventsTable.id, event.id))
        .execute();
      expect(events).toHaveLength(0);
    });

    it('should throw error when user does not exist', async () => {
      const deleteInput: DeleteByIdInput = {
        id: 999
      };

      await expect(deleteUser(deleteInput)).rejects.toThrow(/user not found/i);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const deactivateInput: DeleteByIdInput = {
        id: createdUser.id
      };

      const result = await deactivateUser(deactivateInput);

      expect(result.id).toEqual(createdUser.id);
      expect(result.username).toEqual('testuser');
      expect(result.email).toEqual('test@example.com');
      expect(result.is_active).toBe(false);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should preserve user data when deactivating', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      // Create event for user
      await db.insert(eventsTable)
        .values({
          organizer_id: createdUser.id,
          name: 'Test Event',
          event_date: new Date(),
          qr_code_token: 'test-token-456'
        })
        .execute();

      const deactivateInput: DeleteByIdInput = {
        id: createdUser.id
      };

      await deactivateUser(deactivateInput);

      // Verify user exists but is inactive
      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(dbUser).toHaveLength(1);
      expect(dbUser[0].is_active).toBe(false);

      // Verify events are preserved
      const events = await db.select()
        .from(eventsTable)
        .where(eq(eventsTable.organizer_id, createdUser.id))
        .execute();

      expect(events).toHaveLength(1);
    });

    it('should throw error when user does not exist', async () => {
      const deactivateInput: DeleteByIdInput = {
        id: 999
      };

      await expect(deactivateUser(deactivateInput)).rejects.toThrow(/user not found/i);
    });

    it('should save deactivation to database', async () => {
      const [createdUser] = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const deactivateInput: DeleteByIdInput = {
        id: createdUser.id
      };

      await deactivateUser(deactivateInput);

      const dbUser = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(dbUser[0].is_active).toBe(false);
    });
  });
});