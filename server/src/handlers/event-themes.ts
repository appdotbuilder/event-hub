import { db } from '../db';
import { eventThemesTable, eventsTable } from '../db/schema';
import { type CreateEventThemeInput, type EventTheme, type DeleteByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStandardThemes(): Promise<EventTheme[]> {
  try {
    const themes = await db.select()
      .from(eventThemesTable)
      .where(eq(eventThemesTable.is_standard, true))
      .execute();

    return themes;
  } catch (error) {
    console.error('Failed to fetch standard themes:', error);
    throw error;
  }
}

export async function getAllThemes(): Promise<EventTheme[]> {
  try {
    const themes = await db.select()
      .from(eventThemesTable)
      .execute();

    return themes;
  } catch (error) {
    console.error('Failed to fetch all themes:', error);
    throw error;
  }
}

export async function createEventTheme(input: CreateEventThemeInput): Promise<EventTheme> {
  try {
    const result = await db.insert(eventThemesTable)
      .values({
        name: input.name,
        is_standard: input.is_standard ?? false,
        image_url: input.image_url || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to create event theme:', error);
    throw error;
  }
}

export async function deleteEventTheme(input: DeleteByIdInput): Promise<{ success: boolean }> {
  try {
    // Check if theme is in use by any events
    const eventsUsingTheme = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.theme_id, input.id))
      .execute();

    if (eventsUsingTheme.length > 0) {
      throw new Error('Cannot delete theme: it is currently in use by one or more events');
    }

    // Delete the theme
    const result = await db.delete(eventThemesTable)
      .where(eq(eventThemesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Theme not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete event theme:', error);
    throw error;
  }
}