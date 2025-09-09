import { db } from '../db';
import { contactPersonsTable, eventsTable } from '../db/schema';
import { 
    type CreateContactPersonInput, 
    type UpdateContactPersonInput, 
    type ContactPerson, 
    type DeleteByIdInput 
} from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function createContactPerson(input: CreateContactPersonInput): Promise<ContactPerson> {
    try {
        // Verify that the event exists
        const eventExists = await db.select()
            .from(eventsTable)
            .where(eq(eventsTable.id, input.event_id))
            .execute();

        if (eventExists.length === 0) {
            throw new Error(`Event with id ${input.event_id} not found`);
        }

        // Insert contact person record
        const result = await db.insert(contactPersonsTable)
            .values({
                event_id: input.event_id,
                name: input.name,
                phone_number: input.phone_number ?? null,
                email: input.email ?? null,
                is_contact_person: input.is_contact_person ?? false
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Contact person creation failed:', error);
        throw error;
    }
}

export async function getContactPersonsByEvent(eventId: number): Promise<ContactPerson[]> {
    try {
        // Get all contact persons for the event, ordered by is_contact_person first, then by name
        const results = await db.select()
            .from(contactPersonsTable)
            .where(eq(contactPersonsTable.event_id, eventId))
            .orderBy(desc(contactPersonsTable.is_contact_person), contactPersonsTable.name)
            .execute();

        return results;
    } catch (error) {
        console.error('Failed to fetch contact persons:', error);
        throw error;
    }
}

export async function updateContactPerson(input: UpdateContactPersonInput): Promise<ContactPerson> {
    try {
        // Check if contact person exists
        const existing = await db.select()
            .from(contactPersonsTable)
            .where(eq(contactPersonsTable.id, input.id))
            .execute();

        if (existing.length === 0) {
            throw new Error(`Contact person with id ${input.id} not found`);
        }

        // Build update object with only provided fields
        const updateData: Partial<{
            name: string;
            phone_number: string | null;
            email: string | null;
            is_contact_person: boolean;
        }> = {};
        
        if (input.name !== undefined) {
            updateData['name'] = input.name;
        }
        if (input.phone_number !== undefined) {
            updateData['phone_number'] = input.phone_number;
        }
        if (input.email !== undefined) {
            updateData['email'] = input.email;
        }
        if (input.is_contact_person !== undefined) {
            updateData['is_contact_person'] = input.is_contact_person;
        }

        // Update the contact person
        const result = await db.update(contactPersonsTable)
            .set(updateData)
            .where(eq(contactPersonsTable.id, input.id))
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Contact person update failed:', error);
        throw error;
    }
}

export async function deleteContactPerson(input: DeleteByIdInput): Promise<{ success: boolean }> {
    try {
        // Check if contact person exists
        const existing = await db.select()
            .from(contactPersonsTable)
            .where(eq(contactPersonsTable.id, input.id))
            .execute();

        if (existing.length === 0) {
            throw new Error(`Contact person with id ${input.id} not found`);
        }

        // Delete the contact person
        await db.delete(contactPersonsTable)
            .where(eq(contactPersonsTable.id, input.id))
            .execute();

        return { success: true };
    } catch (error) {
        console.error('Contact person deletion failed:', error);
        throw error;
    }
}