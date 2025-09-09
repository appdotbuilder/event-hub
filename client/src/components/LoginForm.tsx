import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User, LoginInput } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onSignUpClick?: () => void;
}

export function LoginForm({ onLogin, onSignUpClick }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await trpc.login.mutate(formData);
      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        setError(response.message || 'Login fejlede');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Der skete en fejl under login');
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
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="din@email.dk"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
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
            placeholder="Indtast dit kodeord"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
            }
            className="pl-10 pr-10"
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
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600" 
        disabled={isLoading}
      >
        {isLoading ? 'Logger ind...' : 'Log ind'}
      </Button>

      {onSignUpClick && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Har du ikke en konto endnu?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-pink-600 hover:text-pink-700"
              onClick={onSignUpClick}
            >
              Opret en konto
            </Button>
          </p>
        </div>
      )}
    </form>
  );
}