import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Heart, LogOut, Shield, UserIcon, Camera } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import components
import { LandingPage } from '@/components/LandingPage';
import { LoginForm } from '@/components/LoginForm';
import { EventOrganizerDashboard } from '@/components/EventOrganizerDashboard';
import { AdministratorDashboard } from '@/components/AdministratorDashboard';
import { GuestEventView } from '@/components/GuestEventView';

// Import types
import type { User, Event } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [guestEvent, setGuestEvent] = useState<Event | null>(null);
  const [activeView, setActiveView] = useState<'landing' | 'login' | 'organizer' | 'admin' | 'guest'>('landing');

  const loadGuestEvent = useCallback(async (token: string) => {
    try {
      const event = await trpc.getEventByToken.query({ qr_code_token: token });
      setGuestEvent(event);
      setActiveView('guest');
    } catch (error) {
      console.error('Failed to load event:', error);
    }
  }, []);

  // Check if accessing via QR code/token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || urlParams.get('qr');
    if (token) {
      loadGuestEvent(token);
    }
  }, [loadGuestEvent]);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    setActiveView(user.role === 'administrator' ? 'admin' : 'organizer');
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setGuestEvent(null);
    setActiveView('landing');
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  const handleGetStarted = useCallback(() => {
    setActiveView('login');
  }, []);

  // Landing page (no user logged in and no event token)
  if (activeView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Guest view (no authentication required)
  if (activeView === 'guest' && guestEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <GuestEventView event={guestEvent} />
      </div>
    );
  }

  // Main application view
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-pink-500" />
              <h1 className="text-2xl font-bold text-gray-900">EventFlow</h1>
            </div>
            
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {currentUser.role === 'administrator' ? (
                    <Shield className="h-5 w-5 text-purple-500" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium">{currentUser.username}</span>
                  <Badge variant={currentUser.role === 'administrator' ? 'destructive' : 'default'}>
                    {currentUser.role === 'administrator' ? 'Administrator' : 'Brudepar'}
                  </Badge>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Log ud?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Er du sikker på at du vil logge ud?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuller</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Log ud</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {activeView === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setActiveView('landing')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Tilbage til forside
              </Button>
            </div>
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  <Heart className="h-6 w-6 text-pink-500" />
                  <span>Velkommen</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoginForm onLogin={handleLogin} />
              </CardContent>
            </Card>
            
            {/* Guest access section */}
            <Card className="mt-8 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-xl flex items-center justify-center space-x-2">
                  <Camera className="h-5 w-5 text-purple-500" />
                  <span>Gæster</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Har du modtaget et link eller scannet en QR-kode? Du er på det rigtige sted!
                </p>
                <p className="text-sm text-gray-500">
                  Hvis linket ikke virkede automatisk, kan du kopiere det ind i din browser.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'organizer' && currentUser && (
          <EventOrganizerDashboard user={currentUser} />
        )}

        {activeView === 'admin' && currentUser && (
          <AdministratorDashboard user={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>© 2024 EventFlow</span>
            <span>•</span>
            <span>Skabt med ❤️ til brudepar og gæster</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;