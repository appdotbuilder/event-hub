import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventThemesTable, eventsTable, usersTable } from '../db/schema';
import { type CreateEventThemeInput, type DeleteByIdInput } from '../schema';
import { getStandardThemes, getAllThemes, createEventTheme, deleteEventTheme } from '../handlers/event-themes';
import { eq } from 'drizzle-orm';

describe('Event Themes Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createEventTheme', () => {
    it('should create a standard theme', async () => {
      const input: CreateEventThemeInput = {
        name: 'Wedding Theme',
        is_standard: true,
        image_url: 'https://example.com/wedding.jpg'
      };

      const result = await createEventTheme(input);

      expect(result.name).toEqual('Wedding Theme');
      expect(result.is_standard).toBe(true);
      expect(result.image_url).toEqual('https://example.com/wedding.jpg');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should create a custom theme with defaults', async () => {
      const input: CreateEventThemeInput = {
        name: 'Custom Theme',
        is_standard: false
      };

      const result = await createEventTheme(input);

      expect(result.name).toEqual('Custom Theme');
      expect(result.is_standard).toBe(false);
      expect(result.image_url).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save theme to database', async () => {
      const input: CreateEventThemeInput = {
        name: 'Birthday Theme',
        is_standard: true,
        image_url: 'https://example.com/birthday.jpg'
      };

      const result = await createEventTheme(input);

      const themes = await db.select()
        .from(eventThemesTable)
        .where(eq(eventThemesTable.id, result.id))
        .execute();

      expect(themes).toHaveLength(1);
      expect(themes[0].name).toEqual('Birthday Theme');
      expect(themes[0].is_standard).toBe(true);
      expect(themes[0].image_url).toEqual('https://example.com/birthday.jpg');
    });
  });

  describe('getStandardThemes', () => {
    beforeEach(async () => {
      // Create test themes
      await db.insert(eventThemesTable).values([
        { name: 'Standard Theme 1', is_standard: true, image_url: 'url1.jpg' },
        { name: 'Standard Theme 2', is_standard: true, image_url: 'url2.jpg' },
        { name: 'Custom Theme 1', is_standard: false, image_url: 'url3.jpg' }
      ]).execute();
    });

    it('should return only standard themes', async () => {
      const themes = await getStandardThemes();

      expect(themes).toHaveLength(2);
      themes.forEach(theme => {
        expect(theme.is_standard).toBe(true);
      });
    });

    it('should return themes with all properties', async () => {
      const themes = await getStandardThemes();

      expect(themes[0].id).toBeDefined();
      expect(themes[0].name).toBeDefined();
      expect(themes[0].is_standard).toBe(true);
      expect(themes[0].image_url).toBeDefined();
      expect(themes[0].created_at).toBeInstanceOf(Date);
    });

    it('should return empty array when no standard themes exist', async () => {
      // Clear all themes first
      await db.delete(eventThemesTable).execute();

      // Create only custom themes
      await db.insert(eventThemesTable).values([
        { name: 'Custom Theme 1', is_standard: false, image_url: 'url1.jpg' },
        { name: 'Custom Theme 2', is_standard: false, image_url: 'url2.jpg' }
      ]).execute();

      const themes = await getStandardThemes();
      expect(themes).toHaveLength(0);
    });
  });

  describe('getAllThemes', () => {
    beforeEach(async () => {
      // Create test themes
      await db.insert(eventThemesTable).values([
        { name: 'Standard Theme 1', is_standard: true, image_url: 'url1.jpg' },
        { name: 'Standard Theme 2', is_standard: true, image_url: 'url2.jpg' },
        { name: 'Custom Theme 1', is_standard: false, image_url: 'url3.jpg' },
        { name: 'Custom Theme 2', is_standard: false, image_url: null }
      ]).execute();
    });

    it('should return all themes regardless of is_standard flag', async () => {
      const themes = await getAllThemes();

      expect(themes).toHaveLength(4);
      
      const standardThemes = themes.filter(t => t.is_standard);
      const customThemes = themes.filter(t => !t.is_standard);
      
      expect(standardThemes).toHaveLength(2);
      expect(customThemes).toHaveLength(2);
    });

    it('should return themes with all properties', async () => {
      const themes = await getAllThemes();

      themes.forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(typeof theme.is_standard).toBe('boolean');
        expect(theme.created_at).toBeInstanceOf(Date);
        // image_url can be null or string
        expect(theme.image_url === null || typeof theme.image_url === 'string').toBe(true);
      });
    });

    it('should return empty array when no themes exist', async () => {
      // Clear all themes
      await db.delete(eventThemesTable).execute();

      const themes = await getAllThemes();
      expect(themes).toHaveLength(0);
    });
  });

  describe('deleteEventTheme', () => {
    let themeId: number;

    beforeEach(async () => {
      // Create a test theme
      const result = await db.insert(eventThemesTable).values({
        name: 'Test Theme',
        is_standard: false,
        image_url: 'test.jpg'
      }).returning().execute();
      
      themeId = result[0].id;
    });

    it('should delete theme successfully when not in use', async () => {
      const input: DeleteByIdInput = { id: themeId };

      const result = await deleteEventTheme(input);

      expect(result.success).toBe(true);

      // Verify theme was deleted
      const themes = await db.select()
        .from(eventThemesTable)
        .where(eq(eventThemesTable.id, themeId))
        .execute();

      expect(themes).toHaveLength(0);
    });

    it('should throw error when theme is in use by events', async () => {
      // Create a user first (required for events)
      const userResult = await db.insert(usersTable).values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'event_organizer'
      }).returning().execute();

      // Create an event using the theme
      await db.insert(eventsTable).values({
        organizer_id: userResult[0].id,
        name: 'Test Event',
        theme_id: themeId,
        event_date: new Date(),
        qr_code_token: 'test-token-123'
      }).execute();

      const input: DeleteByIdInput = { id: themeId };

      expect(deleteEventTheme(input)).rejects.toThrow(/Cannot delete theme.*in use/);
    });

    it('should throw error when theme does not exist', async () => {
      const input: DeleteByIdInput = { id: 99999 };

      expect(deleteEventTheme(input)).rejects.toThrow(/Theme not found/);
    });

    it('should allow deletion after event stops using theme', async () => {
      // Create a user first
      const userResult = await db.insert(usersTable).values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'event_organizer'
      }).returning().execute();

      // Create an event using the theme
      const eventResult = await db.insert(eventsTable).values({
        organizer_id: userResult[0].id,
        name: 'Test Event',
        theme_id: themeId,
        event_date: new Date(),
        qr_code_token: 'test-token-123'
      }).returning().execute();

      // Update event to not use the theme
      await db.update(eventsTable)
        .set({ theme_id: null })
        .where(eq(eventsTable.id, eventResult[0].id))
        .execute();

      // Now deletion should succeed
      const input: DeleteByIdInput = { id: themeId };
      const result = await deleteEventTheme(input);

      expect(result.success).toBe(true);

      // Verify theme was deleted
      const themes = await db.select()
        .from(eventThemesTable)
        .where(eq(eventThemesTable.id, themeId))
        .execute();

      expect(themes).toHaveLength(0);
    });
  });
});