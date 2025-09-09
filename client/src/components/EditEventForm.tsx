import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Palette, Save } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types
import type { Event, UpdateEventInput, EventTheme } from '../../../server/src/schema';

interface EditEventFormProps {
  event: Event;
  onSubmit: (data: UpdateEventInput) => Promise<void>;
  onCancel: () => void;
}

export function EditEventForm({ event, onSubmit, onCancel }: EditEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [themes, setThemes] = useState<EventTheme[]>([]);
  
  const [formData, setFormData] = useState<UpdateEventInput>({
    id: event.id,
    name: event.name,
    topic: event.topic,
    text_color: event.text_color,
    theme_id: event.theme_id,
    custom_theme_image_url: event.custom_theme_image_url,
    event_date: event.event_date,
    event_time: event.event_time,
    address: event.address,
    postcode: event.postcode,
    city: event.city,
    thank_you_message: event.thank_you_message,
    is_active: event.is_active
  });

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
    } catch (error) {
      console.error('Failed to update event:', error);
      setError('Fejl ved opdatering af begivenhed');
    } finally {
      setIsLoading(false);
    }
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
              value={formData.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdateEventInput) => ({ ...prev, name: e.target.value }))
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
                setFormData((prev: UpdateEventInput) => ({ 
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
                value={formData.event_date ? formData.event_date.toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateEventInput) => ({ 
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
                  setFormData((prev: UpdateEventInput) => ({ 
                    ...prev, 
                    event_time: e.target.value || null 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) =>
                setFormData((prev: UpdateEventInput) => ({ ...prev, is_active: checked }))
              }
            />
            <Label htmlFor="is_active">Begivenhed er aktiv</Label>
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
                setFormData((prev: UpdateEventInput) => ({ 
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
                  setFormData((prev: UpdateEventInput) => ({ 
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
                  setFormData((prev: UpdateEventInput) => ({ 
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
                  setFormData((prev: UpdateEventInput) => ({ 
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
                setFormData((prev: UpdateEventInput) => ({ 
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
                setFormData((prev: UpdateEventInput) => ({ 
                  ...prev, 
                  custom_theme_image_url: e.target.value || null 
                }))
              }
              placeholder="https://example.com/billede.jpg"
            />
          </div>
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
              setFormData((prev: UpdateEventInput) => ({ 
                ...prev, 
                thank_you_message: e.target.value || null 
              }))
            }
            placeholder="f.eks. Tak fordi I deler denne særlige dag med os!"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Event Link */}
      <Card>
        <CardHeader>
          <CardTitle>Gæste Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Link til din begivenhed:</Label>
            <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
              {window.location.origin}/?token={event.qr_code_token}
            </div>
            <p className="text-xs text-gray-500">
              Del dette link med dine gæster, så de kan uploade billeder
            </p>
          </div>
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
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Gemmer...' : 'Gem Ændringer'}
        </Button>
      </div>
    </form>
  );
}