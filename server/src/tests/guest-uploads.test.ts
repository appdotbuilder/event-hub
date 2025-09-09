import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, eventsTable, guestUploadsTable } from '../db/schema';
import { 
  type GuestUploadInput, 
  type UpdateGuestUploadInput, 
  type DeleteByIdInput,
  type GetUploadsByEventInput 
} from '../schema';
import { 
  createGuestUpload, 
  getUploadsByEvent, 
  getAllUploads, 
  updateGuestUpload, 
  deleteGuestUpload, 
  checkUploadRateLimit, 
  downloadUpload 
} from '../handlers/guest-uploads';
import { eq } from 'drizzle-orm';

describe('Guest Uploads Handler', () => {
  let testUserId: number;
  let testEventId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testorganizer',
        email: 'organizer@test.com',
        password_hash: 'hashed_password',
        role: 'event_organizer',
        upload_rate_limit: 5
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test event
    const eventResult = await db.insert(eventsTable)
      .values({
        organizer_id: testUserId,
        name: 'Test Event',
        event_date: new Date('2024-12-31'),
        qr_code_token: 'test-token-123'
      })
      .returning()
      .execute();
    testEventId = eventResult[0].id;
  });

  afterEach(resetDB);

  describe('createGuestUpload', () => {
    const testInput: GuestUploadInput = {
      event_id: 0, // Will be set in test
      guest_name: 'John Doe',
      file_url: 'https://storage.example.com/image.jpg',
      file_name: 'wedding_photo.jpg',
      file_size: 1024000,
      mime_type: 'image/jpeg',
      upload_ip: '192.168.1.100'
    };

    it('should create a guest upload successfully', async () => {
      const input = { ...testInput, event_id: testEventId };
      const result = await createGuestUpload(input);

      expect(result.id).toBeDefined();
      expect(result.event_id).toEqual(testEventId);
      expect(result.guest_name).toEqual('John Doe');
      expect(result.file_url).toEqual('https://storage.example.com/image.jpg');
      expect(result.file_name).toEqual('wedding_photo.jpg');
      expect(result.file_size).toEqual(1024000);
      expect(result.mime_type).toEqual('image/jpeg');
      expect(result.is_favorited).toEqual(false);
      expect(result.upload_ip).toEqual('192.168.1.100');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save upload to database', async () => {
      const input = { ...testInput, event_id: testEventId };
      const result = await createGuestUpload(input);

      const uploads = await db.select()
        .from(guestUploadsTable)
        .where(eq(guestUploadsTable.id, result.id))
        .execute();

      expect(uploads).toHaveLength(1);
      expect(uploads[0].guest_name).toEqual('John Doe');
      expect(uploads[0].file_url).toEqual('https://storage.example.com/image.jpg');
      expect(uploads[0].file_size).toEqual(1024000);
    });

    it('should handle optional upload_ip', async () => {
      const input = { ...testInput, event_id: testEventId, upload_ip: undefined };
      const result = await createGuestUpload(input);

      expect(result.upload_ip).toBeNull();
    });

    it('should throw error for non-existent event', async () => {
      const input = { ...testInput, event_id: 99999 };

      await expect(createGuestUpload(input)).rejects.toThrow(/event not found/i);
    });
  });

  describe('getUploadsByEvent', () => {
    it('should get uploads for an event', async () => {
      // Create test uploads
      await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Alice',
        file_url: 'https://storage.example.com/alice.jpg',
        file_name: 'alice.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Bob',
        file_url: 'https://storage.example.com/bob.jpg',
        file_name: 'bob.jpg',
        file_size: 600000,
        mime_type: 'image/jpeg'
      });

      const input: GetUploadsByEventInput = { event_id: testEventId };
      const results = await getUploadsByEvent(input);

      expect(results).toHaveLength(2);
      expect(results.some(u => u.guest_name === 'Alice')).toBe(true);
      expect(results.some(u => u.guest_name === 'Bob')).toBe(true);
    });

    it('should order favorited uploads first', async () => {
      // Create regular upload
      const upload1 = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Regular User',
        file_url: 'https://storage.example.com/regular.jpg',
        file_name: 'regular.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      // Create favorited upload
      const upload2 = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Favorite User',
        file_url: 'https://storage.example.com/favorite.jpg',
        file_name: 'favorite.jpg',
        file_size: 600000,
        mime_type: 'image/jpeg'
      });

      // Mark second upload as favorited
      await updateGuestUpload({ id: upload2.id, is_favorited: true });

      const input: GetUploadsByEventInput = { event_id: testEventId };
      const results = await getUploadsByEvent(input);

      expect(results).toHaveLength(2);
      expect(results[0].guest_name).toEqual('Favorite User');
      expect(results[0].is_favorited).toBe(true);
      expect(results[1].guest_name).toEqual('Regular User');
      expect(results[1].is_favorited).toBe(false);
    });

    it('should throw error for non-existent event', async () => {
      const input: GetUploadsByEventInput = { event_id: 99999 };

      await expect(getUploadsByEvent(input)).rejects.toThrow(/event not found/i);
    });
  });

  describe('getAllUploads', () => {
    it('should get all uploads across all events', async () => {
      // Create uploads for test event
      await createGuestUpload({
        event_id: testEventId,
        guest_name: 'User 1',
        file_url: 'https://storage.example.com/user1.jpg',
        file_name: 'user1.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      // Create another event and upload
      const event2Result = await db.insert(eventsTable)
        .values({
          organizer_id: testUserId,
          name: 'Another Event',
          event_date: new Date('2024-12-25'),
          qr_code_token: 'test-token-456'
        })
        .returning()
        .execute();

      await createGuestUpload({
        event_id: event2Result[0].id,
        guest_name: 'User 2',
        file_url: 'https://storage.example.com/user2.jpg',
        file_name: 'user2.jpg',
        file_size: 600000,
        mime_type: 'image/jpeg'
      });

      const results = await getAllUploads();

      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(u => u.guest_name === 'User 1')).toBe(true);
      expect(results.some(u => u.guest_name === 'User 2')).toBe(true);
    });

    it('should order uploads by creation date descending', async () => {
      // Create first upload
      const upload1 = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'First User',
        file_url: 'https://storage.example.com/first.jpg',
        file_name: 'first.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create second upload
      const upload2 = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Second User',
        file_url: 'https://storage.example.com/second.jpg',
        file_name: 'second.jpg',
        file_size: 600000,
        mime_type: 'image/jpeg'
      });

      const results = await getAllUploads();

      expect(results.length).toBeGreaterThanOrEqual(2);
      // Most recent first
      const secondIndex = results.findIndex(u => u.id === upload2.id);
      const firstIndex = results.findIndex(u => u.id === upload1.id);
      expect(secondIndex).toBeLessThan(firstIndex);
    });
  });

  describe('updateGuestUpload', () => {
    it('should update upload favorited status', async () => {
      const upload = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Test User',
        file_url: 'https://storage.example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      const input: UpdateGuestUploadInput = {
        id: upload.id,
        is_favorited: true
      };

      const result = await updateGuestUpload(input);

      expect(result.id).toEqual(upload.id);
      expect(result.is_favorited).toBe(true);
      expect(result.guest_name).toEqual('Test User'); // Other fields unchanged
    });

    it('should save update to database', async () => {
      const upload = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Test User',
        file_url: 'https://storage.example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      const input: UpdateGuestUploadInput = {
        id: upload.id,
        is_favorited: true
      };

      await updateGuestUpload(input);

      const updated = await db.select()
        .from(guestUploadsTable)
        .where(eq(guestUploadsTable.id, upload.id))
        .execute();

      expect(updated[0].is_favorited).toBe(true);
    });

    it('should throw error for non-existent upload', async () => {
      const input: UpdateGuestUploadInput = {
        id: 99999,
        is_favorited: true
      };

      await expect(updateGuestUpload(input)).rejects.toThrow(/upload not found/i);
    });
  });

  describe('deleteGuestUpload', () => {
    it('should delete an upload', async () => {
      const upload = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Test User',
        file_url: 'https://storage.example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      const input: DeleteByIdInput = { id: upload.id };
      const result = await deleteGuestUpload(input);

      expect(result.success).toBe(true);

      // Verify upload is deleted from database
      const uploads = await db.select()
        .from(guestUploadsTable)
        .where(eq(guestUploadsTable.id, upload.id))
        .execute();

      expect(uploads).toHaveLength(0);
    });

    it('should throw error for non-existent upload', async () => {
      const input: DeleteByIdInput = { id: 99999 };

      await expect(deleteGuestUpload(input)).rejects.toThrow(/upload not found/i);
    });
  });

  describe('checkUploadRateLimit', () => {
    it('should allow uploads within rate limit', async () => {
      const result = await checkUploadRateLimit(testEventId, '192.168.1.100');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toEqual(5); // Rate limit is 5 for test user
    });

    it('should check rate limit correctly after uploads', async () => {
      // Create 3 uploads from same IP
      for (let i = 0; i < 3; i++) {
        await createGuestUpload({
          event_id: testEventId,
          guest_name: `User ${i}`,
          file_url: `https://storage.example.com/user${i}.jpg`,
          file_name: `user${i}.jpg`,
          file_size: 500000,
          mime_type: 'image/jpeg',
          upload_ip: '192.168.1.100'
        });
      }

      const result = await checkUploadRateLimit(testEventId, '192.168.1.100');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toEqual(2); // 5 - 3 = 2 remaining
    });

    it('should deny uploads when rate limit exceeded', async () => {
      // Create 5 uploads to reach rate limit
      for (let i = 0; i < 5; i++) {
        await createGuestUpload({
          event_id: testEventId,
          guest_name: `User ${i}`,
          file_url: `https://storage.example.com/user${i}.jpg`,
          file_name: `user${i}.jpg`,
          file_size: 500000,
          mime_type: 'image/jpeg',
          upload_ip: '192.168.1.100'
        });
      }

      const result = await checkUploadRateLimit(testEventId, '192.168.1.100');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toEqual(0);
    });

    it('should throw error for non-existent event', async () => {
      await expect(checkUploadRateLimit(99999, '192.168.1.100'))
        .rejects.toThrow(/event not found/i);
    });
  });

  describe('downloadUpload', () => {
    it('should return upload file information', async () => {
      const upload = await createGuestUpload({
        event_id: testEventId,
        guest_name: 'Test User',
        file_url: 'https://storage.example.com/test.jpg',
        file_name: 'test.jpg',
        file_size: 500000,
        mime_type: 'image/jpeg'
      });

      const result = await downloadUpload(upload.id);

      expect(result).not.toBeNull();
      expect(result!.file_url).toEqual('https://storage.example.com/test.jpg');
      expect(result!.file_name).toEqual('test.jpg');
    });

    it('should return null for non-existent upload', async () => {
      const result = await downloadUpload(99999);

      expect(result).toBeNull();
    });
  });
});