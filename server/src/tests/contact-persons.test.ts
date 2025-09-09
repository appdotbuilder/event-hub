import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, eventsTable, eventThemesTable, contactPersonsTable } from '../db/schema';
import { 
    type CreateContactPersonInput, 
    type UpdateContactPersonInput, 
    type DeleteByIdInput 
} from '../schema';
import { 
    createContactPerson, 
    getContactPersonsByEvent, 
    updateContactPerson, 
    deleteContactPerson 
} from '../handlers/contact-persons';
import { eq } from 'drizzle-orm';


// Test user for creating events
const testUser = {
    username: 'test_organizer',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    role: 'event_organizer' as const,
    subscription_status: null,
    is_active: true,
    upload_rate_limit: 10
};

// Test event theme
const testTheme = {
    name: 'Test Theme',
    is_standard: true,
    image_url: 'https://example.com/theme.jpg'
};

// Test event data
const testEvent = {
    name: 'Test Event',
    topic: 'Test Topic',
    text_color: '#000000',
    event_date: new Date('2024-12-25'),
    event_time: '18:00',
    address: 'Test Address',
    postcode: '12345',
    city: 'Test City',
    thank_you_message: 'Thank you!',
    qr_code_token: 'test-qr-token-123',
    is_active: true
};

// Helper function to create test data
async function createTestData() {
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    // Create user with unique email
    const userResult = await db.insert(usersTable)
        .values({
            ...testUser,
            email: `test${timestamp}${uniqueId}@example.com`,
            username: `test_organizer_${uniqueId}`
        })
        .returning()
        .execute();
    const userId = userResult[0].id;

    // Create theme with unique name
    const themeResult = await db.insert(eventThemesTable)
        .values({
            ...testTheme,
            name: `Test Theme ${uniqueId}`
        })
        .returning()
        .execute();
    const themeId = themeResult[0].id;

    // Create event with unique token
    const eventResult = await db.insert(eventsTable)
        .values({
            ...testEvent,
            organizer_id: userId,
            theme_id: themeId,
            qr_code_token: `test-qr-token-${uniqueId}`,
            name: `Test Event ${uniqueId}`
        })
        .returning()
        .execute();
    const eventId = eventResult[0].id;

    return { userId, themeId, eventId };
}

// Test contact person inputs
const testContactPersonInput: CreateContactPersonInput = {
    event_id: 1, // Will be replaced with actual event_id
    name: 'John Doe',
    phone_number: '+1234567890',
    email: 'john.doe@example.com',
    is_contact_person: true
};

const testContactPersonInputMinimal: CreateContactPersonInput = {
    event_id: 1, // Will be replaced with actual event_id
    name: 'Jane Smith',
    is_contact_person: false // Explicitly provide default value
    // phone_number, email will use defaults (undefined -> null)
};

describe('Contact Persons Handler', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    describe('createContactPerson', () => {
        it('should create a contact person with all fields', async () => {
            const { eventId } = await createTestData();
            const input = { ...testContactPersonInput, event_id: eventId };

            const result = await createContactPerson(input);

            expect(result.id).toBeDefined();
            expect(result.event_id).toEqual(eventId);
            expect(result.name).toEqual('John Doe');
            expect(result.phone_number).toEqual('+1234567890');
            expect(result.email).toEqual('john.doe@example.com');
            expect(result.is_contact_person).toEqual(true);
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it('should create a contact person with minimal fields', async () => {
            const { eventId } = await createTestData();
            const input = { ...testContactPersonInputMinimal, event_id: eventId };

            const result = await createContactPerson(input);

            expect(result.id).toBeDefined();
            expect(result.event_id).toEqual(eventId);
            expect(result.name).toEqual('Jane Smith');
            expect(result.phone_number).toBeNull();
            expect(result.email).toBeNull();
            expect(result.is_contact_person).toEqual(false); // Default value
            expect(result.created_at).toBeInstanceOf(Date);
        });

        it('should save contact person to database', async () => {
            const { eventId } = await createTestData();
            const input = { ...testContactPersonInput, event_id: eventId };

            const result = await createContactPerson(input);

            // Verify it was saved to database
            const savedContacts = await db.select()
                .from(contactPersonsTable)
                .where(eq(contactPersonsTable.id, result.id))
                .execute();

            expect(savedContacts).toHaveLength(1);
            expect(savedContacts[0].name).toEqual('John Doe');
            expect(savedContacts[0].phone_number).toEqual('+1234567890');
            expect(savedContacts[0].email).toEqual('john.doe@example.com');
            expect(savedContacts[0].is_contact_person).toEqual(true);
        });

        it('should throw error when event does not exist', async () => {
            const input = { ...testContactPersonInput, event_id: 99999 };

            await expect(createContactPerson(input)).rejects.toThrow(/Event with id 99999 not found/i);
        });
    });

    describe('getContactPersonsByEvent', () => {
        it('should return empty array for event with no contact persons', async () => {
            const { eventId } = await createTestData();

            const result = await getContactPersonsByEvent(eventId);

            expect(result).toEqual([]);
        });

        it('should return all contact persons for an event', async () => {
            const { eventId } = await createTestData();

            // Create multiple contact persons
            await createContactPerson({ ...testContactPersonInput, event_id: eventId });
            await createContactPerson({ 
                ...testContactPersonInputMinimal, 
                event_id: eventId,
                name: 'Alice Johnson' 
            });

            const result = await getContactPersonsByEvent(eventId);

            expect(result).toHaveLength(2);
            expect(result.map(c => c.name)).toContain('John Doe');
            expect(result.map(c => c.name)).toContain('Alice Johnson');
        });

        it('should order contact persons with is_contact_person=true first', async () => {
            const { eventId } = await createTestData();

            // Create regular contact person first
            await createContactPerson({
                event_id: eventId,
                name: 'Regular Person',
                is_contact_person: false
            });

            // Then create designated contact person
            await createContactPerson({
                event_id: eventId,
                name: 'Designated Contact',
                is_contact_person: true
            });

            const result = await getContactPersonsByEvent(eventId);

            expect(result).toHaveLength(2);
            // Designated contact should be first
            expect(result[0].name).toEqual('Designated Contact');
            expect(result[0].is_contact_person).toEqual(true);
            expect(result[1].name).toEqual('Regular Person');
            expect(result[1].is_contact_person).toEqual(false);
        });

        it('should not return contact persons from other events', async () => {
            const { eventId } = await createTestData();
            
            // Create second event
            const { eventId: eventId2 } = await createTestData();

            // Add contact person to first event
            await createContactPerson({ ...testContactPersonInput, event_id: eventId });
            
            // Add contact person to second event
            await createContactPerson({ 
                ...testContactPersonInputMinimal, 
                event_id: eventId2,
                name: 'Other Event Person'
            });

            const result = await getContactPersonsByEvent(eventId);

            expect(result).toHaveLength(1);
            expect(result[0].name).toEqual('John Doe');
            expect(result[0].event_id).toEqual(eventId);
        });
    });

    describe('updateContactPerson', () => {
        it('should update all contact person fields', async () => {
            const { eventId } = await createTestData();
            
            // Create initial contact person
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const updateInput: UpdateContactPersonInput = {
                id: contact.id,
                name: 'Updated John Doe',
                phone_number: '+9876543210',
                email: 'updated.john@example.com',
                is_contact_person: false
            };

            const result = await updateContactPerson(updateInput);

            expect(result.id).toEqual(contact.id);
            expect(result.name).toEqual('Updated John Doe');
            expect(result.phone_number).toEqual('+9876543210');
            expect(result.email).toEqual('updated.john@example.com');
            expect(result.is_contact_person).toEqual(false);
        });

        it('should update only provided fields', async () => {
            const { eventId } = await createTestData();
            
            // Create initial contact person
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const updateInput: UpdateContactPersonInput = {
                id: contact.id,
                name: 'Only Name Updated'
                // Other fields should remain unchanged
            };

            const result = await updateContactPerson(updateInput);

            expect(result.id).toEqual(contact.id);
            expect(result.name).toEqual('Only Name Updated');
            expect(result.phone_number).toEqual('+1234567890'); // Original value
            expect(result.email).toEqual('john.doe@example.com'); // Original value
            expect(result.is_contact_person).toEqual(true); // Original value
        });

        it('should update contact person in database', async () => {
            const { eventId } = await createTestData();
            
            // Create initial contact person
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const updateInput: UpdateContactPersonInput = {
                id: contact.id,
                name: 'Database Updated Name',
                is_contact_person: false
            };

            await updateContactPerson(updateInput);

            // Verify database was updated
            const updatedContact = await db.select()
                .from(contactPersonsTable)
                .where(eq(contactPersonsTable.id, contact.id))
                .execute();

            expect(updatedContact).toHaveLength(1);
            expect(updatedContact[0].name).toEqual('Database Updated Name');
            expect(updatedContact[0].is_contact_person).toEqual(false);
        });

        it('should allow setting fields to null', async () => {
            const { eventId } = await createTestData();
            
            // Create initial contact person with values
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const updateInput: UpdateContactPersonInput = {
                id: contact.id,
                phone_number: null,
                email: null
            };

            const result = await updateContactPerson(updateInput);

            expect(result.phone_number).toBeNull();
            expect(result.email).toBeNull();
            expect(result.name).toEqual('John Doe'); // Unchanged
        });

        it('should throw error when contact person does not exist', async () => {
            const updateInput: UpdateContactPersonInput = {
                id: 99999,
                name: 'Non-existent'
            };

            await expect(updateContactPerson(updateInput)).rejects.toThrow(/Contact person with id 99999 not found/i);
        });
    });

    describe('deleteContactPerson', () => {
        it('should delete contact person successfully', async () => {
            const { eventId } = await createTestData();
            
            // Create contact person
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const deleteInput: DeleteByIdInput = { id: contact.id };

            const result = await deleteContactPerson(deleteInput);

            expect(result.success).toEqual(true);
        });

        it('should remove contact person from database', async () => {
            const { eventId } = await createTestData();
            
            // Create contact person
            const contact = await createContactPerson({ ...testContactPersonInput, event_id: eventId });

            const deleteInput: DeleteByIdInput = { id: contact.id };

            await deleteContactPerson(deleteInput);

            // Verify it was removed from database
            const deletedContact = await db.select()
                .from(contactPersonsTable)
                .where(eq(contactPersonsTable.id, contact.id))
                .execute();

            expect(deletedContact).toHaveLength(0);
        });

        it('should not affect other contact persons', async () => {
            const { eventId } = await createTestData();
            
            // Create multiple contact persons
            const contact1 = await createContactPerson({ ...testContactPersonInput, event_id: eventId });
            const contact2 = await createContactPerson({ 
                ...testContactPersonInputMinimal, 
                event_id: eventId,
                name: 'Keep This Person'
            });

            // Delete first contact person
            await deleteContactPerson({ id: contact1.id });

            // Verify second contact person still exists
            const remaining = await db.select()
                .from(contactPersonsTable)
                .where(eq(contactPersonsTable.event_id, eventId))
                .execute();

            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toEqual(contact2.id);
            expect(remaining[0].name).toEqual('Keep This Person');
        });

        it('should throw error when contact person does not exist', async () => {
            const deleteInput: DeleteByIdInput = { id: 99999 };

            await expect(deleteContactPerson(deleteInput)).rejects.toThrow(/Contact person with id 99999 not found/i);
        });
    });
});