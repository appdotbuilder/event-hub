import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Clock, Users, Upload, Camera, Heart, Phone, Mail, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { Event, EventProgram, ContactPerson } from '../../../server/src/schema';

interface GuestEventViewProps {
  event: Event;
}

export function GuestEventView({ event }: GuestEventViewProps) {
  const [programs, setPrograms] = useState<EventProgram[]>([]);
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [guestName, setGuestName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Load event details
  const loadEventDetails = useCallback(async () => {
    try {
      const [programsData, contactsData] = await Promise.all([
        trpc.getProgramsByEvent.query({ id: event.id }),
        trpc.getContactPersonsByEvent.query({ id: event.id })
      ]);
      setPrograms(programsData);
      setContacts(contactsData.filter((c: ContactPerson) => c.is_contact_person));
    } catch (error) {
      console.error('Failed to load event details:', error);
    }
  }, [event.id]);

  useEffect(() => {
    loadEventDetails();
  }, [loadEventDetails]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const eventDateTime = new Date(event.event_date);
      
      // If event has a specific time, use it
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const diff = eventDateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('Begivenheden er i gang! 🎉');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days} dage, ${hours} timer tilbage`);
      } else if (hours > 0) {
        setCountdown(`${hours} timer, ${minutes} minutter tilbage`);
      } else {
        setCountdown(`${minutes} minutter tilbage`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [event.event_date, event.event_time]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFiles || selectedFiles.length === 0 || !guestName.trim()) {
      setUploadError('Vælg venligst billeder og indtast dit navn');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      // Check rate limit first
      const clientIP = '127.0.0.1'; // In a real app, this would be determined server-side
      const rateLimitCheck = await trpc.checkUploadRateLimit.query({
        eventId: event.id,
        uploadIp: clientIP
      });

      if (!rateLimitCheck.allowed) {
        setUploadError(`Upload limit nået. Prøv igen om ${rateLimitCheck.remaining} sekunder.`);
        setIsUploading(false);
        return;
      }

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // In a real application, you would upload the file to a cloud storage service
        // and get back a URL. For this demo, we'll use a placeholder URL.
        const fileUrl = `https://example.com/uploads/${Date.now()}-${file.name}`;
        
        await trpc.createGuestUpload.mutate({
          event_id: event.id,
          guest_name: guestName.trim(),
          file_url: fileUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          upload_ip: clientIP
        });
      }

      setUploadSuccess(true);
      setGuestName('');
      setSelectedFiles(null);
      
      // Reset form
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Upload fejlede. Prøv venligst igen.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 text-white py-16"
        style={{
          backgroundImage: event.custom_theme_image_url 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${event.custom_theme_image_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 
              className="text-4xl md:text-6xl font-bold mb-4"
              style={{ color: event.text_color || 'white' }}
            >
              {event.name} 💕
            </h1>
            
            {event.topic && (
              <p 
                className="text-xl md:text-2xl mb-6 opacity-90"
                style={{ color: event.text_color || 'white' }}
              >
                {event.topic}
              </p>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {event.event_date.toLocaleDateString('da-DK', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {event.event_time && (
                  <>
                    <Clock className="w-5 h-5 ml-4" />
                    <span>{event.event_time}</span>
                  </>
                )}
              </div>
            </div>

            {countdown && (
              <div className="mt-6">
                <Badge variant="secondary" className="text-lg py-2 px-4">
                  {countdown}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Event Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location */}
            {(event.address || event.city) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-pink-500" />
                    <span>Lokation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-lg">
                    {event.address && <p>{event.address}</p>}
                    {event.postcode && event.city && (
                      <p>{event.postcode} {event.city}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Program */}
            {programs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    <span>Program</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {programs
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((program: EventProgram) => (
                        <div key={program.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <Badge variant="outline" className="min-w-[80px] justify-center">
                            {program.time}
                          </Badge>
                          <span className="text-lg">{program.topic}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Section */}
            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-pink-600">
                  <Camera className="w-6 h-6" />
                  <span>UPLOAD BILLEDER 📸</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border mb-4">
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <Heart className="w-4 h-4 text-pink-500 mr-2" />
                    Kun vi (arrangørerne) kan se dine billeder
                  </p>
                </div>

                {uploadSuccess ? (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Tak for dine billeder! De er uploadet succesfuldt. 🎉
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    {uploadError && (
                      <Alert variant="destructive">
                        <AlertDescription>{uploadError}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="guest-name" className="text-lg">Dit navn</Label>
                      <Input
                        id="guest-name"
                        type="text"
                        placeholder="Indtast dit navn"
                        value={guestName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)}
                        className="text-lg p-3"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="file-upload" className="text-lg">Vælg billeder</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFiles(e.target.files)}
                        className="text-lg p-3"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Du kan vælge flere billeder på én gang
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isUploading}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-lg py-3"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {isUploading ? 'Uploader...' : 'Upload Billeder'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Thank You Message */}
            {event.thank_you_message && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Heart className="w-8 h-8 text-pink-500 mx-auto mb-3" />
                    <p className="text-lg text-gray-800">{event.thank_you_message}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-6">
            {contacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Kontaktpersoner</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.map((contact: ContactPerson) => (
                      <div key={contact.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">{contact.name}</h4>
                        {contact.phone_number && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <a 
                              href={`tel:${contact.phone_number}`}
                              className="text-blue-600 hover:underline"
                            >
                              {contact.phone_number}
                            </a>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Begivenhedsinfo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <strong>Oprettet:</strong> {event.created_at.toLocaleDateString('da-DK')}
                </div>
                <Separator />
                <p className="text-sm text-gray-600">
                  Har du spørgsmål eller problemer med upload? Kontakt arrangørerne ovenfor.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}