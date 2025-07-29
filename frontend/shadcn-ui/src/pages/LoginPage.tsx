import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(phone, password);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 dark:from-[#e50914] dark:via-[#b0060f] dark:to-[#8b0000] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-block">
              <div className="text-4xl font-bold text-white mb-2">
                TicketFlix
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-white">
              Connexion
            </h2>
            <p className="mt-2 text-red-100 dark:text-red-200">
              Accédez à votre compte pour réserver vos événements
            </p>
          </div>

          <Card className="bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Bienvenue
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center">
                Entrez vos identifiants pour vous connecter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-medium">
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Votre numéro de téléphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="bg-white dark:bg-[#222] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-500 dark:focus:border-[#e50914] focus:ring-red-500 dark:focus:ring-[#e50914]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white dark:bg-[#222] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-red-500 dark:focus:border-[#e50914] focus:ring-red-500 dark:focus:ring-[#e50914] pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white font-semibold py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>

                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Pas encore de compte ?{' '}
                    <Link 
                      to="/signup" 
                      className="font-medium text-red-600 dark:text-[#e50914] hover:text-red-500 dark:hover:text-[#b0060f] transition-colors"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-red-100 dark:text-red-200 text-sm">
              En vous connectant, vous acceptez nos{' '}
              <a href="#" className="underline hover:text-white transition-colors">
                conditions d'utilisation
              </a>{' '}
              et notre{' '}
              <a href="#" className="underline hover:text-white transition-colors">
                politique de confidentialité
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}