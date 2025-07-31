import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, User, Mail, Phone, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserForm {
  name: string;
  email: string;
  telephone: string;
  password: string;
  role: string;
}

const roles = [
  { value: 'user', label: 'Utilisateur', description: 'Accès standard à la plateforme' },
  { value: 'admin', label: 'Administrateur', description: 'Accès complet au dashboard' }
];

export default function DashboardNewUserPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>({
    name: '',
    email: '',
    telephone: '',
    password: '',
    role: 'user'
  });

  const handleChange = (field: keyof UserForm, value: string) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!userForm.name.trim()) {
      toast.error('Le nom est requis');
      return false;
    }
    if (!userForm.email.trim()) {
      toast.error('L\'email est requis');
      return false;
    }
    if (!userForm.email.includes('@')) {
      toast.error('L\'email doit être valide');
      return false;
    }
    if (!userForm.telephone.trim()) {
      toast.error('Le numéro de téléphone est requis');
      return false;
    }
    if (userForm.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (!userForm.role) {
      toast.error('Le rôle est requis');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: userForm.name,
        email: userForm.email,
        telephone: userForm.telephone,
        password: userForm.password,
        role: userForm.role
      });

      toast.success('Utilisateur créé avec succès !');
      navigate('/dashboard/users');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      const errorMessage = error?.message || 'Erreur lors de la création de l\'utilisateur';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/users')}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Créer un nouvel utilisateur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Ajoutez un nouvel utilisateur à votre plateforme
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informations de base</span>
                </CardTitle>
                <CardDescription>
                  Remplissez les informations principales de l'utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      value={userForm.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Ex: Jean Dupont"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="exemple@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">Numéro de téléphone *</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={userForm.telephone}
                      onChange={(e) => handleChange('telephone', e.target.value)}
                      placeholder="0700000000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <Select value={userForm.role} onValueChange={(value) => handleChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{role.label}</span>
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Mot de passe sécurisé"
                      required
                      className="pr-10"
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
                  <p className="text-xs text-muted-foreground">
                    Le mot de passe doit contenir au moins 6 caractères
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informations sur les rôles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Informations sur les rôles</span>
                </CardTitle>
                <CardDescription>
                  Comprendre les différents niveaux d'accès
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roles.map((role) => (
                  <div key={role.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      role.value === 'admin' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium">{role.label}</h4>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      {role.value === 'admin' && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          ⚠️ Les administrateurs ont accès à toutes les fonctionnalités du dashboard
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/users')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer l'utilisateur
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 