import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Calendar, MapPin, Clock, Palette, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { CreateEventInput, EventTheme } from '../../../server/src/schema';

interface CreateEventFormProps {
  onSubmit: (data: CreateEventInput) => Promise<void>;
  onCancel: () => void;
}

interface ProgramEntry {
  topic: string;
  time: string;
  order_index: number;
}

interface ContactEntry {
  name: string;
  phone_number: string;
  email: string;
  is_contact_person: boolean;
}

export function CreateEventForm({ onSubmit, onCancel }: CreateEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [themes, setThemes] = useState<EventTheme[]>([]);
  
  const [formData, setFormData] = useState<CreateEventInput>({
    name: '',
    topic: null,
    text_color: '#ffffff',
    theme_id: null,
    custom_theme_image_url: null,
    event_date: new Date(),
    event_time: null,
    address: null,
    postcode: null,
    city: null,
    thank_you_message: null
  });

  const [programs, setPrograms] = useState<ProgramEntry[]>([]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);

  // Load themes
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themesData = await trpc.getStandardThemes.query();
        setThemes(themesData);
      } catch (error) {
        console.error('Failed to load themes:', error);
      }
    };
    loadThemes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      
      // TODO: In a full implementation, you would also create programs and contacts
      // This would require the backend to return the created event ID
      
    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Fejl ved oprettelse af begivenhed');
    } finally {
      setIsLoading(false);
    }
  };

  const addProgram = () => {
    setPrograms([...programs, { topic: '', time: '', order_index: programs.length }]);
  };

  const updateProgram = (index: number, field: keyof ProgramEntry, value: string) => {
    const updated = programs.map((program, i) => 
      i === index ? { ...program, [field]: value } : program
    );
    setPrograms(updated);
  };

  const removeProgram = (index: number) => {
    setPrograms(programs.filter((_, i) => i !== index));
  };

  const addContact = () => {
    setContacts([...contacts, { name: '', phone_number: '', email: '', is_contact_person: false }]);
  };

  const updateContact = (index: number, field: keyof ContactEntry, value: string | boolean) => {
    const updated = contacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setContacts(updated);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Grundlæggende Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Begivenhedens navn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEventInput) => ({ ...prev, name: e.target.value }))
              }
              placeholder="f.eks. Anna & Peters Bryllup"
              required
            />
          </div>

          <div>
            <Label htmlFor="topic">Emne/Undertitel</Label>
            <Input
              id="topic"
              value={formData.topic || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEventInput) => ({ 
                  ...prev, 
                  topic: e.target.value || null 
                }))
              }
              placeholder="f.eks. Vores store dag"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Dato *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEventInput) => ({ 
                    ...prev, 
                    event_date: new Date(e.target.value) 
                  }))
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="event_time">Tid</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEventInput) => ({ 
                    ...prev, 
                    event_time: e.target.value || null 
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Lokation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEventInput) => ({ 
                  ...prev, 
                  address: e.target.value || null 
                }))
              }
              placeholder="f.eks. Nytorv 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postcode">Postnummer</Label>
              <Input
                id="postcode"
                value={formData.postcode || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEventInput) => ({ 
                    ...prev, 
                    postcode: e.target.value || null 
                  }))
                }
                placeholder="f.eks. 1000"
              />
            </div>

            <div>
              <Label htmlFor="city">By</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEventInput) => ({ 
                    ...prev, 
                    city: e.target.value || null 
                  }))
                }
                placeholder="f.eks. København"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Design</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text_color">Tekstfarve</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="text_color"
                type="color"
                value={formData.text_color || '#ffffff'}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateEventInput) => ({ 
                    ...prev, 
                    text_color: e.target.value 
                  }))
                }
                className="w-20 h-10"
              />
              <span className="text-sm text-gray-600">
                Farve på tekst på forsiden
              </span>
            </div>
          </div>

          <div>
            <Label>Tema</Label>
            <Select
              value={formData.theme_id?.toString() || 'none'}
              onValueChange={(value) => 
                setFormData((prev: CreateEventInput) => ({ 
                  ...prev, 
                  theme_id: value === 'none' ? null : parseInt(value) 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Vælg et tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Intet tema</SelectItem>
                {themes.map((theme: EventTheme) => (
                  <SelectItem key={theme.id} value={theme.id.toString()}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="custom_theme_image_url">Brugerdefineret baggrundsbillede URL</Label>
            <Input
              id="custom_theme_image_url"
              type="url"
              value={formData.custom_theme_image_url || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateEventInput) => ({ 
                  ...prev, 
                  custom_theme_image_url: e.target.value || null 
                }))
              }
              placeholder="https://example.com/billede.jpg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Program</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addProgram}>
              <Plus className="w-4 h-4 mr-1" />
              Tilføj
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Ingen programpunkter endnu</p>
          ) : (
            <div className="space-y-3">
              {programs.map((program, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={program.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProgram(index, 'time', e.target.value)
                    }
                    className="w-32"
                  />
                  <Input
                    placeholder="Programpunkt"
                    value={program.topic}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateProgram(index, 'topic', e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProgram(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>Kontaktpersoner</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addContact}>
              <Plus className="w-4 h-4 mr-1" />
              Tilføj
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Ingen kontaktpersoner endnu</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Kontaktperson {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeContact(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Navn"
                      value={contact.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateContact(index, 'name', e.target.value)
                      }
                    />
                    <Input
                      placeholder="Telefonnummer"
                      value={contact.phone_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateContact(index, 'phone_number', e.target.value)
                      }
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={contact.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateContact(index, 'email', e.target.value)
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`contact-${index}`}
                        checked={contact.is_contact_person}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateContact(index, 'is_contact_person', e.target.checked)
                        }
                      />
                      <Label htmlFor={`contact-${index}`}>Vis som kontaktperson</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thank you message */}
      <Card>
        <CardHeader>
          <CardTitle>Takkebesked</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="thank_you_message">Besked til gæsterne</Label>
          <Textarea
            id="thank_you_message"
            value={formData.thank_you_message || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateEventInput) => ({ 
                ...prev, 
                thank_you_message: e.target.value || null 
              }))
            }
            placeholder="f.eks. Tak fordi I deler denne særlige dag med os!"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit buttons */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuller
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isLoading ? 'Opretter...' : 'Opret Begivenhed'}
        </Button>
      </div>
    </form>
  );
}