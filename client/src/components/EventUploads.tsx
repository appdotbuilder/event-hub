import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Download, Heart, Trash2, Image, Calendar } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { Event, GuestUpload } from '../../../server/src/schema';

interface EventUploadsProps {
  events: Event[];
  selectedEvent: Event | null;
  onEventSelect: (event: Event | null) => void;
}

export function EventUploads({ events, selectedEvent, onEventSelect }: EventUploadsProps) {
  const [uploads, setUploads] = useState<GuestUpload[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<GuestUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const loadUploads = useCallback(async () => {
    if (!selectedEvent) {
      setUploads([]);
      return;
    }

    setIsLoading(true);
    try {
      const uploadsData = await trpc.getUploadsByEvent.query({ 
        event_id: selectedEvent.id 
      });
      setUploads(uploadsData);
    } catch (error) {
      console.error('Failed to load uploads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Filter uploads based on search term and favorites
  useEffect(() => {
    let filtered = uploads;

    if (searchTerm) {
      filtered = filtered.filter((upload: GuestUpload) =>
        upload.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        upload.file_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterFavorites) {
      filtered = filtered.filter((upload: GuestUpload) => upload.is_favorited);
    }

    setFilteredUploads(filtered);
  }, [uploads, searchTerm, filterFavorites]);

  const handleToggleFavorite = useCallback(async (upload: GuestUpload) => {
    try {
      await trpc.updateGuestUpload.mutate({
        id: upload.id,
        is_favorited: !upload.is_favorited
      });
      
      setUploads((prev: GuestUpload[]) =>
        prev.map((u: GuestUpload) =>
          u.id === upload.id ? { ...u, is_favorited: !u.is_favorited } : u
        )
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
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

  const handleDownloadUpload = useCallback(async (upload: GuestUpload) => {
    try {
      // In a real app, this would trigger a download
      window.open(upload.file_url, '_blank');
    } catch (error) {
      console.error('Failed to download upload:', error);
    }
  }, []);

  const totalSize = uploads.reduce((acc, upload) => acc + upload.file_size, 0);
  const favoriteCount = uploads.filter((upload: GuestUpload) => upload.is_favorited).length;

  return (
    <div className="space-y-6">
      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Vælg Begivenhed</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedEvent?.id.toString() || ''}
            onValueChange={(value) => {
              const event = events.find((e: Event) => e.id === parseInt(value));
              onEventSelect(event || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vælg en begivenhed for at se uploads" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event: Event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {event.event_date.toLocaleDateString('da-DK')}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Totale Billeder</p>
                    <p className="text-2xl font-bold">{uploads.length}</p>
                  </div>
                  <Image className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Favoritter</p>
                    <p className="text-2xl font-bold">{favoriteCount}</p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Størrelse</p>
                    <p className="text-2xl font-bold">{(totalSize / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                  <Download className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unikke Gæster</p>
                    <p className="text-2xl font-bold">
                      {new Set(uploads.map((u: GuestUpload) => u.guest_name)).size}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Søg efter gæst eller filnavn..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="filter-favorites"
                    checked={filterFavorites}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterFavorites(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="filter-favorites" className="text-sm font-medium">
                    Kun favoritter
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploads Grid */}
          <Card>
            <CardHeader>
              <CardTitle>
                Uploadede Billeder 
                <Badge variant="secondary" className="ml-2">
                  {filteredUploads.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-gray-600">Indlæser billeder...</div>
                </div>
              ) : filteredUploads.length === 0 ? (
                <div className="text-center py-8">
                  <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {uploads.length === 0 
                      ? 'Ingen billeder uploadet endnu' 
                      : 'Ingen billeder matcher dine filtre'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUploads.map((upload: GuestUpload) => (
                    <Card key={upload.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Image placeholder - in a real app, show actual image */}
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                            <Image className="w-12 h-12 text-gray-400" />
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium truncate" title={upload.file_name}>
                              {upload.file_name}
                            </h4>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>👤 {upload.guest_name}</span>
                              <span>{(upload.file_size / 1024 / 1024).toFixed(1)}MB</span>
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              {upload.created_at.toLocaleDateString('da-DK')} kl. {upload.created_at.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(upload)}
                              className={upload.is_favorited ? 'text-pink-500' : 'text-gray-400'}
                            >
                              <Heart className={`w-4 h-4 ${upload.is_favorited ? 'fill-current' : ''}`} />
                            </Button>
                            
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadUpload(upload)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Slet billede</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Er du sikker på at du vil slette dette billede? Handlingen kan ikke fortrydes.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuller</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUpload(upload.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Slet billede
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}