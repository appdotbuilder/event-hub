import { db } from '../db';
import { guestUploadsTable, eventsTable, usersTable } from '../db/schema';
import { 
  type GuestUploadInput, 
  type UpdateGuestUploadInput, 
  type GuestUpload, 
  type DeleteByIdInput,
  type GetUploadsByEventInput 
} from '../schema';
import { eq, desc, gte, and, count } from 'drizzle-orm';

export async function createGuestUpload(input: GuestUploadInput): Promise<GuestUpload> {
  try {
    // Verify event exists
    const event = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, input.event_id))
      .limit(1)
      .execute();

    if (event.length === 0) {
      throw new Error('Event not found');
    }

    // Insert guest upload record
    const result = await db.insert(guestUploadsTable)
      .values({
        event_id: input.event_id,
        guest_name: input.guest_name,
        file_url: input.file_url,
        file_name: input.file_name,
        file_size: input.file_size,
        mime_type: input.mime_type,
        upload_ip: input.upload_ip || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Guest upload creation failed:', error);
    throw error;
  }
}

export async function getUploadsByEvent(input: GetUploadsByEventInput): Promise<GuestUpload[]> {
  try {
    // Verify event exists
    const event = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, input.event_id))
      .limit(1)
      .execute();

    if (event.length === 0) {
      throw new Error('Event not found');
    }

    // Get uploads for the event, ordered with favorited first
    const uploads = await db.select()
      .from(guestUploadsTable)
      .where(eq(guestUploadsTable.event_id, input.event_id))
      .orderBy(desc(guestUploadsTable.is_favorited), desc(guestUploadsTable.created_at))
      .execute();

    return uploads;
  } catch (error) {
    console.error('Failed to get uploads by event:', error);
    throw error;
  }
}

export async function getAllUploads(): Promise<GuestUpload[]> {
  try {
    // Get all uploads ordered by creation date (most recent first)
    const uploads = await db.select()
      .from(guestUploadsTable)
      .orderBy(desc(guestUploadsTable.created_at))
      .execute();

    return uploads;
  } catch (error) {
    console.error('Failed to get all uploads:', error);
    throw error;
  }
}

export async function updateGuestUpload(input: UpdateGuestUploadInput): Promise<GuestUpload> {
  try {
    // Check if upload exists
    const existingUpload = await db.select()
      .from(guestUploadsTable)
      .where(eq(guestUploadsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingUpload.length === 0) {
      throw new Error('Upload not found');
    }

    // Build update values
    const updateValues: Partial<typeof guestUploadsTable.$inferInsert> = {};
    
    if (input.is_favorited !== undefined) {
      updateValues.is_favorited = input.is_favorited;
    }

    // Update the upload
    const result = await db.update(guestUploadsTable)
      .set(updateValues)
      .where(eq(guestUploadsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Guest upload update failed:', error);
    throw error;
  }
}

export async function deleteGuestUpload(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    // Check if upload exists
    const existingUpload = await db.select()
      .from(guestUploadsTable)
      .where(eq(guestUploadsTable.id, input.id))
      .limit(1)
      .execute();

    if (existingUpload.length === 0) {
      throw new Error('Upload not found');
    }

    // Delete the upload
    await db.delete(guestUploadsTable)
      .where(eq(guestUploadsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Guest upload deletion failed:', error);
    throw error;
  }
}

export async function checkUploadRateLimit(eventId: number, uploadIp: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    // Get event with organizer to check rate limit
    const eventWithOrganizer = await db.select()
      .from(eventsTable)
      .innerJoin(usersTable, eq(eventsTable.organizer_id, usersTable.id))
      .where(eq(eventsTable.id, eventId))
      .limit(1)
      .execute();

    if (eventWithOrganizer.length === 0) {
      throw new Error('Event not found');
    }

    const rateLimit = eventWithOrganizer[0].users.upload_rate_limit;
    
    // Count uploads from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const uploadCount = await db.select({ count: count() })
      .from(guestUploadsTable)
      .where(
        and(
          eq(guestUploadsTable.event_id, eventId),
          eq(guestUploadsTable.upload_ip, uploadIp),
          gte(guestUploadsTable.created_at, oneHourAgo)
        )
      )
      .execute();

    const currentUploads = uploadCount[0].count;
    const allowed = currentUploads < rateLimit;
    const remaining = Math.max(0, rateLimit - currentUploads);

    return { allowed, remaining };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    throw error;
  }
}

export async function downloadUpload(uploadId: number): Promise<{ file_url: string; file_name: string } | null> {
  try {
    // Get upload details
    const upload = await db.select()
      .from(guestUploadsTable)
      .where(eq(guestUploadsTable.id, uploadId))
      .limit(1)
      .execute();

    if (upload.length === 0) {
      return null;
    }

    return {
      file_url: upload[0].file_url,
      file_name: upload[0].file_name
    };
  } catch (error) {
    console.error('Download upload failed:', error);
    throw error;
  }
}