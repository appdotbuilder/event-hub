import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, eventsTable, eventProgramsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createEventProgram } from '../handlers/event-programs';
import { type CreateEventProgramInput } from '../schema';

describe('createEventProgram', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let testUserId: number;
    let testEventId: number;

    beforeEach(async () => {
        // Create a test user first
        const userResult = await db.insert(usersTable)
            .values({
                username: 'testorganizer',
                email: 'organizer@test.com',
                password_hash: 'hashedpassword',
                role: 'event_organizer'
            })
            .returning()
            .execute();
        
        testUserId = userResult[0].id;

        // Create a test event
        const eventResult = await db.insert(eventsTable)
            .values({
                organizer_id: testUserId,
                name: 'Test Event',
                event_date: new Date('2024-12-25'),
                qr_code_token: 'test-token-123'
            })
            .returning()
            .execute();
        
        testEventId = eventResult[0].id;
    });

    it('should create an event program entry successfully', async () => {
        const testInput: CreateEventProgramInput = {
            event_id: testEventId,
            topic: 'Opening Ceremony',
            time: '10:00',
            order_index: 1
        };

        const result = await createEventProgram(testInput);

        // Verify the returned program entry
        expect(result.id).toBeDefined();
        expect(result.event_id).toEqual(testEventId);
        expect(result.topic).toEqual('Opening Ceremony');
        expect(result.time).toEqual('10:00');
        expect(result.order_index).toEqual(1);
        expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save the program entry to database', async () => {
        const testInput: CreateEventProgramInput = {
            event_id: testEventId,
            topic: 'Keynote Speech',
            time: '11:00',
            order_index: 2
        };

        const result = await createEventProgram(testInput);

        // Query the database directly to verify it was saved
        const programs = await db.select()
            .from(eventProgramsTable)
            .where(eq(eventProgramsTable.id, result.id))
            .execute();

        expect(programs).toHaveLength(1);
        expect(programs[0].event_id).toEqual(testEventId);
        expect(programs[0].topic).toEqual('Keynote Speech');
        expect(programs[0].time).toEqual('11:00');
        expect(programs[0].order_index).toEqual(2);
        expect(programs[0].created_at).toBeInstanceOf(Date);
    });

    it('should create multiple program entries for the same event', async () => {
        const inputs: CreateEventProgramInput[] = [
            {
                event_id: testEventId,
                topic: 'Registration',
                time: '09:00',
                order_index: 0
            },
            {
                event_id: testEventId,
                topic: 'Workshop Session 1',
                time: '14:00',
                order_index: 3
            },
            {
                event_id: testEventId,
                topic: 'Closing Remarks',
                time: '17:00',
                order_index: 4
            }
        ];

        const results = await Promise.all(
            inputs.map(input => createEventProgram(input))
        );

        expect(results).toHaveLength(3);
        results.forEach((result, index) => {
            expect(result.id).toBeDefined();
            expect(result.event_id).toEqual(testEventId);
            expect(result.topic).toEqual(inputs[index].topic);
            expect(result.time).toEqual(inputs[index].time);
            expect(result.order_index).toEqual(inputs[index].order_index);
        });

        // Verify all entries were saved to database
        const allPrograms = await db.select()
            .from(eventProgramsTable)
            .where(eq(eventProgramsTable.event_id, testEventId))
            .execute();

        expect(allPrograms).toHaveLength(3);
    });

    it('should throw error when event does not exist', async () => {
        const testInput: CreateEventProgramInput = {
            event_id: 99999, // Non-existent event ID
            topic: 'Test Program',
            time: '12:00',
            order_index: 1
        };

        await expect(createEventProgram(testInput)).rejects.toThrow(/Event with id 99999 not found/i);
    });

    it('should handle different time formats correctly', async () => {
        const testInput: CreateEventProgramInput = {
            event_id: testEventId,
            topic: 'Lunch Break',
            time: '12:30 PM',
            order_index: 5
        };

        const result = await createEventProgram(testInput);

        expect(result.time).toEqual('12:30 PM');
        expect(result.topic).toEqual('Lunch Break');
    });

    it('should preserve order_index values correctly', async () => {
        const testInput: CreateEventProgramInput = {
            event_id: testEventId,
            topic: 'Special Session',
            time: '15:45',
            order_index: 10
        };

        const result = await createEventProgram(testInput);

        expect(result.order_index).toEqual(10);

        // Verify in database
        const program = await db.select()
            .from(eventProgramsTable)
            .where(eq(eventProgramsTable.id, result.id))
            .execute();

        expect(program[0].order_index).toEqual(10);
    });
});