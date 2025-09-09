import { db } from '../db';
import { eventsTable, usersTable, eventThemesTable, eventProgramsTable, contactPersonsTable, guestUploadsTable } from '../db/schema';
import { 
    type CreateEventInput, 
    type UpdateEventInput, 
    type Event, 
    type DeleteByIdInput,
    type GetEventsByOrganizerInput,
    type GetEventByTokenInput 
} from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createEvent(input: CreateEventInput, organizerId: number): Promise<Event> {
    try {
        // Validate organizer exists
        const organizer = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, organizerId))
            .execute();
        
        if (organizer.length === 0) {
            throw new Error('Organizer not found');
        }

        // Validate theme exists if provided
        if (input.theme_id) {
            const theme = await db.select()
                .from(eventThemesTable)
                .where(eq(eventThemesTable.id, input.theme_id))
                .execute();
            
            if (theme.length === 0) {
                throw new Error('Theme not found');
            }
        }

        // Generate unique QR code token
        const qrToken = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create event record
        const result = await db.insert(eventsTable)
            .values({
                organizer_id: organizerId,
                name: input.name,
                topic: input.topic || null,
                text_color: input.text_color || null,
                theme_id: input.theme_id || null,
                custom_theme_image_url: input.custom_theme_image_url || null,
                event_date: input.event_date,
                event_time: input.event_time || null,
                address: input.address || null,
                postcode: input.postcode || null,
                city: input.city || null,
                thank_you_message: input.thank_you_message || null,
                qr_code_token: qrToken,
                is_active: true
            })
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Event creation failed:', error);
        throw error;
    }
}

export async function getEventsByOrganizer(input: GetEventsByOrganizerInput): Promise<Event[]> {
    try {
        const results = await db.select()
            .from(eventsTable)
            .where(eq(eventsTable.organizer_id, input.organizer_id))
            .execute();

        return results;
    } catch (error) {
        console.error('Get events by organizer failed:', error);
        throw error;
    }
}

export async function getAllEvents(): Promise<Event[]> {
    try {
        const results = await db.select()
            .from(eventsTable)
            .execute();

        return results;
    } catch (error) {
        console.error('Get all events failed:', error);
        throw error;
    }
}

export async function getEventById(id: number): Promise<Event | null> {
    try {
        const results = await db.select()
            .from(eventsTable)
            .where(eq(eventsTable.id, id))
            .execute();

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Get event by ID failed:', error);
        throw error;
    }
}

export async function getEventByToken(input: GetEventByTokenInput): Promise<Event | null> {
    try {
        const results = await db.select()
            .from(eventsTable)
            .where(eq(eventsTable.qr_code_token, input.qr_code_token))
            .execute();

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Get event by token failed:', error);
        throw error;
    }
}

export async function updateEvent(input: UpdateEventInput): Promise<Event> {
    try {
        // Check if event exists
        const existingEvent = await getEventById(input.id);
        if (!existingEvent) {
            throw new Error('Event not found');
        }

        // Validate theme exists if provided
        if (input.theme_id !== undefined) {
            if (input.theme_id === null) {
                // Allow setting theme_id to null
            } else {
                const theme = await db.select()
                    .from(eventThemesTable)
                    .where(eq(eventThemesTable.id, input.theme_id))
                    .execute();
                
                if (theme.length === 0) {
                    throw new Error('Theme not found');
                }
            }
        }

        // Build update object only with provided fields
        const updateData: any = {};
        
        if (input.name !== undefined) updateData.name = input.name;
        if (input.topic !== undefined) updateData.topic = input.topic;
        if (input.text_color !== undefined) updateData.text_color = input.text_color;
        if (input.theme_id !== undefined) updateData.theme_id = input.theme_id;
        if (input.custom_theme_image_url !== undefined) updateData.custom_theme_image_url = input.custom_theme_image_url;
        if (input.event_date !== undefined) updateData.event_date = input.event_date;
        if (input.event_time !== undefined) updateData.event_time = input.event_time;
        if (input.address !== undefined) updateData.address = input.address;
        if (input.postcode !== undefined) updateData.postcode = input.postcode;
        if (input.city !== undefined) updateData.city = input.city;
        if (input.thank_you_message !== undefined) updateData.thank_you_message = input.thank_you_message;
        if (input.is_active !== undefined) updateData.is_active = input.is_active;

        // Always update the updated_at timestamp
        updateData.updated_at = new Date();

        // Update the event
        const result = await db.update(eventsTable)
            .set(updateData)
            .where(eq(eventsTable.id, input.id))
            .returning()
            .execute();

        return result[0];
    } catch (error) {
        console.error('Event update failed:', error);
        throw error;
    }
}

export async function deleteEvent(input: DeleteByIdInput): Promise<{ success: boolean }> {
    try {
        // Check if event exists
        const existingEvent = await getEventById(input.id);
        if (!existingEvent) {
            throw new Error('Event not found');
        }

        // Delete related records first (cascade delete)
        // Delete guest uploads
        await db.delete(guestUploadsTable)
            .where(eq(guestUploadsTable.event_id, input.id))
            .execute();

        // Delete contact persons
        await db.delete(contactPersonsTable)
            .where(eq(contactPersonsTable.event_id, input.id))
            .execute();

        // Delete event programs
        await db.delete(eventProgramsTable)
            .where(eq(eventProgramsTable.event_id, input.id))
            .execute();

        // Delete the event itself
        await db.delete(eventsTable)
            .where(eq(eventsTable.id, input.id))
            .execute();

        return { success: true };
    } catch (error) {
        console.error('Event deletion failed:', error);
        throw error;
    }
}