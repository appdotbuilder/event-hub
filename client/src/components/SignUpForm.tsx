import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateUserInput, UserRole } from '../../../server/src/schema';

interface SignUpFormProps {
  onSuccess: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    role: 'event_organizer',
    subscription_status: null,
    upload_rate_limit: 10
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await trpc.createUser.mutate(formData);
      onSuccess();
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          setError('En bruger med denne email eksisterer allerede');
        } else if (error.message.includes('Invalid email')) {
          setError('Indtast venligst en gyldig email adresse');
        } else if (error.message.includes('Password')) {
          setError('Kodeordet skal være mindst 6 tegn langt');
        } else {
          setError('Der skete en fejl under oprettelse af kontoen');
        }
      } else {
        setError('Der skete en fejl under oprettelse af kontoen');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Brugernavn</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="username"
            type="text"
            placeholder="Indtast dit brugernavn"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
            }
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="din@email.dk"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
            }
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kodeord</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mindst 6 tegn"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
            }
            className="pl-10 pr-10"
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-500">Kodeordet skal være mindst 6 tegn langt</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Kontotype</Label>
        <Select
          value={formData.role || 'event_organizer'}
          onValueChange={(value: UserRole) =>
            setFormData((prev: CreateUserInput) => ({ ...prev, role: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Vælg kontotype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event_organizer">
              Event Arrangør (Brudepar)
            </SelectItem>
            <SelectItem value="administrator">
              Administrator
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Vælg "Event Arrangør" hvis du skal oprette bryllupper eller andre events
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" 
        disabled={isLoading}
      >
        {isLoading ? 'Opretter konto...' : 'Opret Konto'}
      </Button>
    </form>
  );
}