import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  loginInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  deleteByIdInputSchema,
  createEventThemeInputSchema,
  createEventInputSchema,
  updateEventInputSchema,
  getEventsByOrganizerInputSchema,
  getEventByTokenInputSchema,
  createEventProgramInputSchema,
  updateEventProgramInputSchema,
  createContactPersonInputSchema,
  updateContactPersonInputSchema,
  guestUploadInputSchema,
  updateGuestUploadInputSchema,
  getUploadsByEventInputSchema,
  reorderProgramsInputSchema,
  checkRateLimitInputSchema
} from './schema';

// Import handlers
import { login, createUser, getCurrentUser } from './handlers/auth';
import { getAllUsers, getUserById, updateUser, deleteUser, deactivateUser } from './handlers/users';
import { getStandardThemes, getAllThemes, createEventTheme, deleteEventTheme } from './handlers/event-themes';
import { 
  createEvent, 
  getEventsByOrganizer, 
  getAllEvents, 
  getEventById, 
  getEventByToken, 
  updateEvent, 
  deleteEvent 
} from './handlers/events';
import { 
  createEventProgram, 
  getProgramsByEvent, 
  updateEventProgram, 
  deleteEventProgram, 
  reorderEventPrograms 
} from './handlers/event-programs';
import { 
  createContactPerson, 
  getContactPersonsByEvent, 
  updateContactPerson, 
  deleteContactPerson 
} from './handlers/contact-persons';
import { 
  createGuestUpload, 
  getUploadsByEvent, 
  getAllUploads, 
  updateGuestUpload, 
  deleteGuestUpload, 
  checkUploadRateLimit, 
  downloadUpload 
} from './handlers/guest-uploads';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getCurrentUser: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => getCurrentUser(input.id)),

  // User management routes (admin)
  getAllUsers: publicProcedure
    .query(() => getAllUsers()),

  getUserById: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => getUserById(input.id)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  deactivateUser: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deactivateUser(input)),

  // Event theme routes
  getStandardThemes: publicProcedure
    .query(() => getStandardThemes()),

  getAllThemes: publicProcedure
    .query(() => getAllThemes()),

  createEventTheme: publicProcedure
    .input(createEventThemeInputSchema)
    .mutation(({ input }) => createEventTheme(input)),

  deleteEventTheme: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteEventTheme(input)),

  // Event routes
  createEvent: publicProcedure
    .input(createEventInputSchema)
    .mutation(({ input }) => {
      // TODO: Get organizerId from authenticated user context
      const organizerId = 1; // Placeholder
      return createEvent(input, organizerId);
    }),

  getEventsByOrganizer: publicProcedure
    .input(getEventsByOrganizerInputSchema)
    .query(({ input }) => getEventsByOrganizer(input)),

  getAllEvents: publicProcedure
    .query(() => getAllEvents()),

  getEventById: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => getEventById(input.id)),

  getEventByToken: publicProcedure
    .input(getEventByTokenInputSchema)
    .query(({ input }) => getEventByToken(input)),

  updateEvent: publicProcedure
    .input(updateEventInputSchema)
    .mutation(({ input }) => updateEvent(input)),

  deleteEvent: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteEvent(input)),

  // Event program routes
  createEventProgram: publicProcedure
    .input(createEventProgramInputSchema)
    .mutation(({ input }) => createEventProgram(input)),

  getProgramsByEvent: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => getProgramsByEvent(input.id)),

  updateEventProgram: publicProcedure
    .input(updateEventProgramInputSchema)
    .mutation(({ input }) => updateEventProgram(input)),

  deleteEventProgram: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteEventProgram(input)),

  reorderEventPrograms: publicProcedure
    .input(reorderProgramsInputSchema)
    .mutation(({ input }) => reorderEventPrograms(input.eventId, input.programIds)),

  // Contact person routes
  createContactPerson: publicProcedure
    .input(createContactPersonInputSchema)
    .mutation(({ input }) => createContactPerson(input)),

  getContactPersonsByEvent: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => getContactPersonsByEvent(input.id)),

  updateContactPerson: publicProcedure
    .input(updateContactPersonInputSchema)
    .mutation(({ input }) => updateContactPerson(input)),

  deleteContactPerson: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteContactPerson(input)),

  // Guest upload routes
  createGuestUpload: publicProcedure
    .input(guestUploadInputSchema)
    .mutation(({ input }) => createGuestUpload(input)),

  getUploadsByEvent: publicProcedure
    .input(getUploadsByEventInputSchema)
    .query(({ input }) => getUploadsByEvent(input)),

  getAllUploads: publicProcedure
    .query(() => getAllUploads()),

  updateGuestUpload: publicProcedure
    .input(updateGuestUploadInputSchema)
    .mutation(({ input }) => updateGuestUpload(input)),

  deleteGuestUpload: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteGuestUpload(input)),

  checkUploadRateLimit: publicProcedure
    .input(checkRateLimitInputSchema)
    .query(({ input }) => checkUploadRateLimit(input.eventId, input.uploadIp)),

  downloadUpload: publicProcedure
    .input(deleteByIdInputSchema)
    .query(({ input }) => downloadUpload(input.id)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();