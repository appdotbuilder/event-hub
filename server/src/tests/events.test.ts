import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eventsTable, usersTable, eventThemesTable, eventProgramsTable, contactPersonsTable, guestUploadsTable } from '../db/schema';
import { 
    type CreateEventInput, 
    type UpdateEventInput, 
    type GetEventsByOrganizerInput,
    type GetEventByTokenInput,
    type DeleteByIdInput 
} from '../schema';
import { 
    createEvent, 
    getEventsByOrganizer, 
    getAllEvents, 
    getEventById, 
    getEventByToken, 
    updateEvent, 
    deleteEvent 
} from '../handlers/events';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
    username: 'testorganizer',
    email: 'test@example.com',
    password_hash: 'hashedpassword',
    role: 'event_organizer' as const,
    subscription_status: 'active',
    is_active: true,
    upload_rate_limit: 10
};

const testTheme = {
    name: 'Test Theme',
    is_standard: true,
    image_url: 'https://example.com/theme.jpg'
};

const testEventInput: CreateEventInput = {
    name: 'Test Event',
    topic: 'Test Topic',
    text_color: '#FF0000',
    theme_id: null,
    custom_theme_image_url: 'https://example.com/custom.jpg',
    event_date: new Date('2024-12-25'),
    event_time: '14:00',
    address: '123 Test Street',
    postcode: '12345',
    city: 'Test City',
    thank_you_message: 'Thank you for attending!'
};

describe('Event Handlers', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    describe('createEvent', () => {
        it('should create an event successfully', async () => {
            // Create organizer first
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const result = await createEvent(testEventInput, organizer[0].id);

            expect(result.id).toBeDefined();
            expect(result.organizer_id).toEqual(organizer[0].id);
            expect(result.name).toEqual('Test Event');
            expect(result.topic).toEqual('Test Topic');
            expect(result.text_color).toEqual('#FF0000');
            expect(result.theme_id).toBeNull();
            expect(result.custom_theme_image_url).toEqual('https://example.com/custom.jpg');
            expect(result.event_date).toEqual(new Date('2024-12-25'));
            expect(result.event_time).toEqual('14:00');
            expect(result.address).toEqual('123 Test Street');
            expect(result.postcode).toEqual('12345');
            expect(result.city).toEqual('Test City');
            expect(result.thank_you_message).toEqual('Thank you for attending!');
            expect(result.qr_code_token).toBeDefined();
            expect(result.qr_code_token.length).toBeGreaterThan(10);
            expect(result.is_active).toBe(true);
            expect(result.created_at).toBeInstanceOf(Date);
            expect(result.updated_at).toBeInstanceOf(Date);
        });

        it('should create event with theme reference', async () => {
            // Create organizer and theme
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const theme = await db.insert(eventThemesTable)
                .values(testTheme)
                .returning()
                .execute();

            const eventInput = { ...testEventInput, theme_id: theme[0].id };
            const result = await createEvent(eventInput, organizer[0].id);

            expect(result.theme_id).toEqual(theme[0].id);
        });

        it('should create event with minimal data', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const minimalInput: CreateEventInput = {
                name: 'Minimal Event',
                event_date: new Date('2024-12-25')
            };

            const result = await createEvent(minimalInput, organizer[0].id);

            expect(result.name).toEqual('Minimal Event');
            expect(result.topic).toBeNull();
            expect(result.text_color).toBeNull();
            expect(result.theme_id).toBeNull();
            expect(result.event_time).toBeNull();
        });

        it('should throw error for non-existent organizer', async () => {
            expect(createEvent(testEventInput, 999)).rejects.toThrow(/organizer not found/i);
        });

        it('should throw error for non-existent theme', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const eventInput = { ...testEventInput, theme_id: 999 };
            expect(createEvent(eventInput, organizer[0].id)).rejects.toThrow(/theme not found/i);
        });

        it('should save event to database', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const result = await createEvent(testEventInput, organizer[0].id);

            const savedEvent = await db.select()
                .from(eventsTable)
                .where(eq(eventsTable.id, result.id))
                .execute();

            expect(savedEvent).toHaveLength(1);
            expect(savedEvent[0].name).toEqual('Test Event');
            expect(savedEvent[0].organizer_id).toEqual(organizer[0].id);
        });
    });

    describe('getEventsByOrganizer', () => {
        it('should return events for specific organizer', async () => {
            // Create two organizers
            const organizer1 = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const organizer2 = await db.insert(usersTable)
                .values({ ...testUser, email: 'organizer2@example.com', username: 'organizer2' })
                .returning()
                .execute();

            // Create events for both organizers
            await createEvent(testEventInput, organizer1[0].id);
            await createEvent({ ...testEventInput, name: 'Event 2' }, organizer1[0].id);
            await createEvent({ ...testEventInput, name: 'Other Event' }, organizer2[0].id);

            const input: GetEventsByOrganizerInput = { organizer_id: organizer1[0].id };
            const result = await getEventsByOrganizer(input);

            expect(result).toHaveLength(2);
            expect(result.every(event => event.organizer_id === organizer1[0].id)).toBe(true);
        });

        it('should return empty array for organizer with no events', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const input: GetEventsByOrganizerInput = { organizer_id: organizer[0].id };
            const result = await getEventsByOrganizer(input);

            expect(result).toHaveLength(0);
        });
    });

    describe('getAllEvents', () => {
        it('should return all events', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            await createEvent(testEventInput, organizer[0].id);
            await createEvent({ ...testEventInput, name: 'Event 2' }, organizer[0].id);

            const result = await getAllEvents();

            expect(result).toHaveLength(2);
            expect(result[0].name).toEqual('Test Event');
            expect(result[1].name).toEqual('Event 2');
        });

        it('should return empty array when no events exist', async () => {
            const result = await getAllEvents();
            expect(result).toHaveLength(0);
        });
    });

    describe('getEventById', () => {
        it('should return event by ID', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);
            const result = await getEventById(createdEvent.id);

            expect(result).not.toBeNull();
            expect(result!.id).toEqual(createdEvent.id);
            expect(result!.name).toEqual('Test Event');
        });

        it('should return null for non-existent event', async () => {
            const result = await getEventById(999);
            expect(result).toBeNull();
        });
    });

    describe('getEventByToken', () => {
        it('should return event by QR token', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);
            const input: GetEventByTokenInput = { qr_code_token: createdEvent.qr_code_token };
            const result = await getEventByToken(input);

            expect(result).not.toBeNull();
            expect(result!.id).toEqual(createdEvent.id);
            expect(result!.qr_code_token).toEqual(createdEvent.qr_code_token);
        });

        it('should return null for invalid token', async () => {
            const input: GetEventByTokenInput = { qr_code_token: 'invalid_token' };
            const result = await getEventByToken(input);
            expect(result).toBeNull();
        });
    });

    describe('updateEvent', () => {
        it('should update event successfully', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);

            const updateInput: UpdateEventInput = {
                id: createdEvent.id,
                name: 'Updated Event',
                topic: 'Updated Topic',
                is_active: false
            };

            const result = await updateEvent(updateInput);

            expect(result.id).toEqual(createdEvent.id);
            expect(result.name).toEqual('Updated Event');
            expect(result.topic).toEqual('Updated Topic');
            expect(result.is_active).toBe(false);
            expect(result.updated_at.getTime()).toBeGreaterThan(createdEvent.updated_at.getTime());
        });

        it('should update only provided fields', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);

            const updateInput: UpdateEventInput = {
                id: createdEvent.id,
                name: 'Partially Updated Event'
            };

            const result = await updateEvent(updateInput);

            expect(result.name).toEqual('Partially Updated Event');
            expect(result.topic).toEqual(testEventInput.topic || null); // Should remain unchanged
            expect(result.address).toEqual(testEventInput.address || null); // Should remain unchanged
        });

        it('should allow setting theme_id to null', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const theme = await db.insert(eventThemesTable)
                .values(testTheme)
                .returning()
                .execute();

            const eventInput = { ...testEventInput, theme_id: theme[0].id };
            const createdEvent = await createEvent(eventInput, organizer[0].id);

            const updateInput: UpdateEventInput = {
                id: createdEvent.id,
                theme_id: null
            };

            const result = await updateEvent(updateInput);
            expect(result.theme_id).toBeNull();
        });

        it('should throw error for non-existent event', async () => {
            const updateInput: UpdateEventInput = {
                id: 999,
                name: 'Updated Event'
            };

            expect(updateEvent(updateInput)).rejects.toThrow(/event not found/i);
        });

        it('should throw error for non-existent theme', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);

            const updateInput: UpdateEventInput = {
                id: createdEvent.id,
                theme_id: 999
            };

            expect(updateEvent(updateInput)).rejects.toThrow(/theme not found/i);
        });
    });

    describe('deleteEvent', () => {
        it('should delete event and cascade related data', async () => {
            const organizer = await db.insert(usersTable)
                .values(testUser)
                .returning()
                .execute();

            const createdEvent = await createEvent(testEventInput, organizer[0].id);

            // Create related data
            await db.insert(eventProgramsTable)
                .values({
                    event_id: createdEvent.id,
                    topic: 'Test Program',
                    time: '10:00',
                    order_index: 1
                })
                .execute();

            await db.insert(contactPersonsTable)
                .values({
                    event_id: createdEvent.id,
                    name: 'Test Contact',
                    email: 'contact@example.com',
                    is_contact_person: true
                })
                .execute();

            await db.insert(guestUploadsTable)
                .values({
                    event_id: createdEvent.id,
                    guest_name: 'Test Guest',
                    file_url: 'https://example.com/file.jpg',
                    file_name: 'file.jpg',
                    file_size: 1024,
                    mime_type: 'image/jpeg'
                })
                .execute();

            const deleteInput: DeleteByIdInput = { id: createdEvent.id };
            const result = await deleteEvent(deleteInput);

            expect(result.success).toBe(true);

            // Verify event is deleted
            const deletedEvent = await getEventById(createdEvent.id);
            expect(deletedEvent).toBeNull();

            // Verify related data is deleted
            const programs = await db.select()
                .from(eventProgramsTable)
                .where(eq(eventProgramsTable.event_id, createdEvent.id))
                .execute();
            expect(programs).toHaveLength(0);

            const contacts = await db.select()
                .from(contactPersonsTable)
                .where(eq(contactPersonsTable.event_id, createdEvent.id))
                .execute();
            expect(contacts).toHaveLength(0);

            const uploads = await db.select()
                .from(guestUploadsTable)
                .where(eq(guestUploadsTable.event_id, createdEvent.id))
                .execute();
            expect(uploads).toHaveLength(0);
        });

        it('should throw error for non-existent event', async () => {
            const deleteInput: DeleteByIdInput = { id: 999 };
            expect(deleteEvent(deleteInput)).rejects.toThrow(/event not found/i);
        });
    });
});