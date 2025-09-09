import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, Calendar, Upload, Trash2, Edit, UserX, UserCheck, Search, Download } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { User, Event, GuestUpload } from '../../../server/src/schema';

interface AdministratorDashboardProps {
  user: User;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdministratorDashboard(_props: AdministratorDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [uploads, setUploads] = useState<GuestUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [usersData, eventsData, uploadsData] = await Promise.all([
        trpc.getAllUsers.query(),
        trpc.getAllEvents.query(),
        trpc.getAllUploads.query()
      ]);
      setUsers(usersData);
      setEvents(eventsData);
      setUploads(uploadsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateUser = useCallback(async (userData: { id: number; username?: string; email?: string; upload_rate_limit?: number; is_active?: boolean }) => {
    try {
      const updatedUser = await trpc.updateUser.mutate(userData);
      setUsers((prev: User[]) => 
        prev.map((u: User) => u.id === updatedUser.id ? updatedUser : u)
      );
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId: number) => {
    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((u: User) => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }, []);

  const handleDeactivateUser = useCallback(async (userId: number) => {
    try {
      await trpc.deactivateUser.mutate({ id: userId });
      setUsers((prev: User[]) => 
        prev.map((u: User) => u.id === userId ? { ...u, is_active: false } : u)
      );
    } catch (error) {
      console.error('Failed to deactivate user:', error);
    }
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: number) => {
    try {
      await trpc.deleteEvent.mutate({ id: eventId });
      setEvents((prev: Event[]) => prev.filter((e: Event) => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }, []);

  const handleDeleteUpload = useCallback(async (uploadId: number) => {
    try {
      await trpc.deleteGuestUpload.mutate({ id: uploadId });
      setUploads((prev: GuestUpload[]) => prev.filter((u: GuestUpload) => u.id !== uploadId));
    } catch (error) {
      console.error('Failed to delete upload:', error);
    }
  }, []);

  const filteredUsers = users.filter((u: User) => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter((e: Event) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.topic && e.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUploads = uploads.filter((u: GuestUpload) =>
    u.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Indlæser administratordata...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center space-x-2">
          <Shield className="h-8 w-8 text-purple-500" />
          <span>Administrator Dashboard</span>
        </h2>
        <p className="text-gray-600">
          Administrer brugere, begivenheder og uploads
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Brugere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u: User) => u.is_active).length} aktive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Begivenheder</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              {events.filter((e: Event) => e.is_active).length} aktive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploads.length}</div>
            <p className="text-xs text-muted-foreground">
              {uploads.filter((u: GuestUpload) => u.is_favorited).length} favoritter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Søg..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Brugere ({users.length})</TabsTrigger>
          <TabsTrigger value="events">Begivenheder ({events.length})</TabsTrigger>
          <TabsTrigger value="uploads">Uploads ({uploads.length})</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Brugeradministration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brugernavn</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Upload Grænse</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u: User) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'administrator' ? 'destructive' : 'default'}>
                          {u.role === 'administrator' ? 'Admin' : 'Brudepar'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.upload_rate_limit}/min</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(u)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          {u.is_active ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <UserX className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deaktiver bruger</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Er du sikker på at du vil deaktivere {u.username}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeactivateUser(u.id)}>
                                    Deaktiver
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUser({ id: u.id, is_active: true })}
                            >
                              <UserCheck className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Slet bruger</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Er du sikker på at du vil slette {u.username}? Alle deres begivenheder og data vil også blive slettet.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuller</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Slet bruger
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Begivenhedsadministration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Organisator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((e: Event) => {
                    const organizer = users.find((u: User) => u.id === e.organizer_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>{e.event_date.toLocaleDateString('da-DK')}</TableCell>
                        <TableCell>{organizer?.username || 'Ukendt'}</TableCell>
                        <TableCell>
                          <Badge variant={e.is_active ? 'default' : 'secondary'}>
                            {e.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Slet begivenhed</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Er du sikker på at du vil slette "{e.name}"? Alle tilhørende uploads vil også blive slettet.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteEvent(e.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Slet begivenhed
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Uploads Tab */}
        <TabsContent value="uploads">
          <Card>
            <CardHeader>
              <CardTitle>Upload Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filnavn</TableHead>
                    <TableHead>Gæst</TableHead>
                    <TableHead>Begivenhed</TableHead>
                    <TableHead>Størrelse</TableHead>
                    <TableHead>Dato</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUploads.map((upload: GuestUpload) => {
                    const event = events.find((e: Event) => e.id === upload.event_id);
                    return (
                      <TableRow key={upload.id}>
                        <TableCell className="font-medium">{upload.file_name}</TableCell>
                        <TableCell>{upload.guest_name}</TableCell>
                        <TableCell>{event?.name || 'Ukendt'}</TableCell>
                        <TableCell>{(upload.file_size / 1024 / 1024).toFixed(1)} MB</TableCell>
                        <TableCell>{upload.created_at.toLocaleDateString('da-DK')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(upload.file_url, '_blank')}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Slet upload</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Er du sikker på at du vil slette denne fil?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUpload(upload.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Slet upload
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rediger Bruger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Brugernavn</Label>
                <Input
                  id="username"
                  defaultValue={editingUser.username}
                  onBlur={(e) => {
                    if (e.target.value !== editingUser.username) {
                      handleUpdateUser({ 
                        id: editingUser.id, 
                        username: e.target.value 
                      });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={editingUser.email}
                  onBlur={(e) => {
                    if (e.target.value !== editingUser.email) {
                      handleUpdateUser({ 
                        id: editingUser.id, 
                        email: e.target.value 
                      });
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="uploadLimit">Upload Grænse (pr. minut)</Label>
                <Input
                  id="uploadLimit"
                  type="number"
                  defaultValue={editingUser.upload_rate_limit}
                  onBlur={(e) => {
                    const newLimit = parseInt(e.target.value);
                    if (newLimit !== editingUser.upload_rate_limit) {
                      handleUpdateUser({ 
                        id: editingUser.id, 
                        upload_rate_limit: newLimit 
                      });
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Luk
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}