import { db } from '../db';
import { usersTable, eventsTable, guestUploadsTable, eventProgramsTable, contactPersonsTable } from '../db/schema';
import { type UpdateUserInput, type User, type DeleteByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await db.select()
      .from(usersTable)
      .execute();

    return users;
  } catch (error) {
    console.error('Get all users failed:', error);
    throw error;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    return users[0] || null;
  } catch (error) {
    console.error('Get user by id failed:', error);
    throw error;
  }
}

export async function updateUser(input: UpdateUserInput): Promise<User> {
  try {
    // Check if user exists
    const existingUser = await getUserById(input.id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.username !== undefined) {
      updateData.username = input.username;
    }
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    if (input.subscription_status !== undefined) {
      updateData.subscription_status = input.subscription_status;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }
    if (input.upload_rate_limit !== undefined) {
      updateData.upload_rate_limit = input.upload_rate_limit;
    }

    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Update user failed:', error);
    throw error;
  }
}

export async function deleteUser(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    // Check if user exists
    const existingUser = await getUserById(input.id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Delete in order: uploads -> contact persons -> event programs -> events -> user
    // First get all user events
    const userEvents = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.organizer_id, input.id))
      .execute();

    // Delete uploads for all user events
    for (const event of userEvents) {
      await db.delete(guestUploadsTable)
        .where(eq(guestUploadsTable.event_id, event.id))
        .execute();
    }

    // Delete contact persons for all user events
    for (const event of userEvents) {
      await db.delete(contactPersonsTable)
        .where(eq(contactPersonsTable.event_id, event.id))
        .execute();
    }

    // Delete event programs for all user events
    for (const event of userEvents) {
      await db.delete(eventProgramsTable)
        .where(eq(eventProgramsTable.event_id, event.id))
        .execute();
    }

    // Delete user events
    await db.delete(eventsTable)
      .where(eq(eventsTable.organizer_id, input.id))
      .execute();

    // Finally delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Delete user failed:', error);
    throw error;
  }
}

export async function deactivateUser(input: DeleteByIdInput): Promise<User> {
  try {
    // Check if user exists
    const existingUser = await getUserById(input.id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const result = await db.update(usersTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Deactivate user failed:', error);
    throw error;
  }
}