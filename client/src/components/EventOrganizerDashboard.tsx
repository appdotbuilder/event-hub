import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Calendar, Users, Upload, Trash2, Edit, Share } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import components
import { CreateEventForm } from '@/components/CreateEventForm';
import { EditEventForm } from '@/components/EditEventForm';
import { EventUploads } from '@/components/EventUploads';

// Import types
import type { User, Event, CreateEventInput, UpdateEventInput } from '../../../server/src/schema';

interface EventOrganizerDashboardProps {
  user: User;
}

export function EventOrganizerDashboard({ user }: EventOrganizerDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('events');

  const loadEvents = useCallback(async () => {
    try {
      const result = await trpc.getEventsByOrganizer.query({ organizer_id: user.id });
      setEvents(result);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = useCallback(async (eventData: CreateEventInput) => {
    try {
      const newEvent = await trpc.createEvent.mutate(eventData);
      setEvents((prev: Event[]) => [newEvent, ...prev]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }, []);

  const handleUpdateEvent = useCallback(async (eventData: UpdateEventInput) => {
    try {
      const updatedEvent = await trpc.updateEvent.mutate(eventData);
      setEvents((prev: Event[]) => 
        prev.map((event: Event) => event.id === updatedEvent.id ? updatedEvent : event)
      );
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: number) => {
    try {
      await trpc.deleteEvent.mutate({ id: eventId });
      setEvents((prev: Event[]) => prev.filter((event: Event) => event.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }, []);

  const generateEventLink = useCallback((event: Event) => {
    return `${window.location.origin}/?token=${event.qr_code_token}`;
  }, []);

  const copyEventLink = useCallback(async (event: Event) => {
    const link = generateEventLink(event);
    try {
      await navigator.clipboard.writeText(link);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [generateEventLink]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Indlæser dine begivenheder...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Velkommen, {user.username}! 💖
        </h2>
        <p className="text-gray-600">
          Administrer dine begivenheder og se gæsternes billeder
        </p>
        {user.subscription_status && (
          <Badge className="mt-2" variant="secondary">
            {user.subscription_status}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Mine Begivenheder</TabsTrigger>
          <TabsTrigger value="uploads">Gæstebilleder</TabsTrigger>
          <TabsTrigger value="account">Min Konto</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Mine Begivenheder</h3>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opret Begivenhed
            </Button>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Du har endnu ikke oprettet nogen begivenheder</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  Opret din første begivenhed
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event: Event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{event.name}</span>
                      <div className="flex space-x-2">
                        <Badge variant={event.is_active ? "default" : "secondary"}>
                          {event.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{event.event_date.toLocaleDateString('da-DK')}</span>
                        {event.event_time && <span>{event.event_time}</span>}
                      </div>
                      {event.city && (
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{event.city}</span>
                        </div>
                      )}
                      {event.topic && (
                        <p className="text-gray-700 mt-2">{event.topic}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingEvent(event)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Rediger
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyEventLink(event)}
                      >
                        <Share className="w-3 h-3 mr-1" />
                        Del Link
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEvent(event);
                          setActiveTab('uploads');
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Billeder
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Slet
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Slet begivenhed</AlertDialogTitle>
                            <AlertDialogDescription>
                              Er du sikker på at du vil slette "{event.name}"? Alle tilhørende billeder og data vil også blive slettet. Denne handling kan ikke fortrydes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuller</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Slet begivenhed
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Event Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Opret Ny Begivenhed</h3>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    ✕
                  </Button>
                </div>
                <CreateEventForm 
                  onSubmit={handleCreateEvent}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          )}

          {/* Edit Event Modal */}
          {editingEvent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Rediger Begivenhed</h3>
                  <Button 
                    variant="ghost" 
                    onClick={() => setEditingEvent(null)}
                  >
                    ✕
                  </Button>
                </div>
                <EditEventForm 
                  event={editingEvent}
                  onSubmit={handleUpdateEvent}
                  onCancel={() => setEditingEvent(null)}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads">
          <EventUploads 
            events={events} 
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
          />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Min Konto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Brugernavn</label>
                  <p className="text-lg">{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Abonnement</label>
                  <p className="text-lg">{user.subscription_status || 'Ingen aktiv'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Upload grænse</label>
                  <p className="text-lg">{user.upload_rate_limit} pr. minut</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-6">
                <h4 className="text-lg font-semibold text-red-600 mb-2">Farezone</h4>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slet Min Konto
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>⚠️ Slet konto permanent</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>ADVARSEL:</strong> Denne handling vil permanent slette din konto og alle dine begivenheder, samt alle billeder uploadet af gæster. Denne handling kan IKKE fortrydes.
                        <br/><br/>
                        Er du absolut sikker på at du vil fortsætte?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Nej, behold min konto</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                        Ja, slet min konto permanent
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}