import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Save, ArrowLeft, Calendar, MapPin, User, Clock, Star, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface TicketForm {
  categorie: string;
  prix: number;
  stock: number;
}

interface EventForm {
  titre: string;
  description: string;
  date: string;
  image_url: string;
  lieu: string;
  categorie: string;
  organisateur: string;
  note: string;
  duree: string;
}

const categories = [
  'Concert',
  'Théâtre',
  'Cinéma',
  'Sport',
  'Conférence',
  'Exposition',
  'Festival',
  'Comédie',
  'Danse',
  'Autre'
];

const ticketCategories = [
  'VIP',
  'Premium',
  'Standard',
  'Économique',
  'Étudiant',
  'Senior',
  'Enfant'
];

export default function DashboardNewEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>({
    titre: '',
    description: '',
    date: '',
    image_url: '',
    lieu: '',
    categorie: '',
    organisateur: '',
    note: '4.0',
    duree: '2 heures'
  });

  const [tickets, setTickets] = useState<TicketForm[]>([
    { categorie: 'Standard', prix: 0, stock: 0 }
  ]);

  const handleEventChange = (field: keyof EventForm, value: string) => {
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTicketChange = (index: number, field: keyof TicketForm, value: string | number) => {
    setTickets(prev => prev.map((ticket, i) => 
      i === index ? { ...ticket, [field]: value } : ticket
    ));
  };

  const addTicket = () => {
    setTickets(prev => [...prev, { categorie: 'Standard', prix: 0, stock: 0 }]);
  };

  const removeTicket = (index: number) => {
    if (tickets.length > 1) {
      setTickets(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = (): boolean => {
    if (!eventForm.titre.trim()) {
      toast.error('Le titre est requis');
      return false;
    }
    if (!eventForm.description.trim()) {
      toast.error('La description est requise');
      return false;
    }
    if (!eventForm.date) {
      toast.error('La date est requise');
      return false;
    }
    if (!eventForm.lieu.trim()) {
      toast.error('Le lieu est requis');
      return false;
    }
    if (!eventForm.categorie) {
      toast.error('La catégorie est requise');
      return false;
    }
    if (!eventForm.organisateur.trim()) {
      toast.error('L\'organisateur est requis');
      return false;
    }

    // Validation des tickets
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (!ticket.categorie.trim()) {
        toast.error(`La catégorie du ticket ${i + 1} est requise`);
        return false;
      }
      if (ticket.prix <= 0) {
        toast.error(`Le prix du ticket ${i + 1} doit être supérieur à 0`);
        return false;
      }
      if (ticket.stock <= 0) {
        toast.error(`Le stock du ticket ${i + 1} doit être supérieur à 0`);
        return false;
      }
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
      // Créer l'événement
      const eventResponse = await api.post('/events', eventForm);
      const eventId = eventResponse.id;

      // Créer les tickets pour cet événement
      const ticketPromises = tickets.map(ticket =>
        api.post('/tickets', {
          event_id: eventId,
          categorie: ticket.categorie,
          prix: ticket.prix,
          stock: ticket.stock
        })
      );

      await Promise.all(ticketPromises);

      toast.success('Événement créé avec succès !');
      navigate('/dashboard/events');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/events')}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Créer un nouvel événement
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Ajoutez un nouvel événement à votre plateforme
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Informations de base</span>
                </CardTitle>
                <CardDescription>
                  Remplissez les informations principales de votre événement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="titre">Titre de l'événement *</Label>
                    <Input
                      id="titre"
                      value={eventForm.titre}
                      onChange={(e) => handleEventChange('titre', e.target.value)}
                      placeholder="Ex: Concert de Jazz en plein air"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie *</Label>
                    <Select value={eventForm.categorie} onValueChange={(value) => handleEventChange('categorie', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date et heure *</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={eventForm.date}
                      onChange={(e) => handleEventChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duree">Durée</Label>
                    <Input
                      id="duree"
                      value={eventForm.duree}
                      onChange={(e) => handleEventChange('duree', e.target.value)}
                      placeholder="Ex: 2 heures"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lieu">Lieu *</Label>
                    <Input
                      id="lieu"
                      value={eventForm.lieu}
                      onChange={(e) => handleEventChange('lieu', e.target.value)}
                      placeholder="Ex: Salle des fêtes de la ville"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organisateur">Organisateur *</Label>
                    <Input
                      id="organisateur"
                      value={eventForm.organisateur}
                      onChange={(e) => handleEventChange('organisateur', e.target.value)}
                      placeholder="Ex: Association Culturelle"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Input
                      id="note"
                      value={eventForm.note}
                      onChange={(e) => handleEventChange('note', e.target.value)}
                      placeholder="Ex: 4.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL de l'image</Label>
                    <Input
                      id="image_url"
                      value={eventForm.image_url}
                      onChange={(e) => handleEventChange('image_url', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => handleEventChange('description', e.target.value)}
                    placeholder="Décrivez votre événement en détail..."
                    rows={4}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuration des tickets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Configuration des tickets</span>
                </CardTitle>
                <CardDescription>
                  Définissez les différents types de tickets disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tickets.map((ticket, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Ticket {index + 1}</h4>
                      {tickets.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTicket(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Catégorie *</Label>
                        <Select 
                          value={ticket.categorie} 
                          onValueChange={(value) => handleTicketChange(index, 'categorie', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {ticketCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Prix (FCFA) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={ticket.prix}
                          onChange={(e) => handleTicketChange(index, 'prix', parseInt(e.target.value) || 0)}
                          placeholder="5000"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Stock disponible *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ticket.stock}
                          onChange={(e) => handleTicketChange(index, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addTicket}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un type de ticket
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/events')}
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
                    Créer l'événement
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