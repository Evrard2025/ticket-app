import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, FormsModule],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  event: any = null;
  tickets: any[] = [];
  loading = true;
  error = '';
  quantity: { [ticketId: number]: number } = {};
  reserving = false;

  constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getEvent(+id).subscribe({
        next: (event) => {
          this.event = event;
          this.api.getTickets(event.id).subscribe({
            next: (tickets) => {
              this.tickets = tickets;
              this.loading = false;
            },
            error: (err) => {
              this.error = err.error?.message || 'Erreur lors du chargement des tickets';
              this.loading = false;
            }
          });
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors du chargement de l\'événement';
          this.loading = false;
        }
      });
    } else {
      this.error = 'ID événement manquant';
      this.loading = false;
    }
  }

  // Regroupe les tickets par catégorie pour affichage
  get ticketsByCategory() {
    const map: { [cat: string]: any[] } = {};
    for (const t of this.tickets) {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    }
    return map;
  }

  onReserve(ticket: any, qty: number) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth']);
      return;
    }
    const user = this.parseJwt(token);
    if (!user?.id) {
      this.router.navigate(['/auth']);
      return;
    }
    this.reserving = true;
    this.api.pay({ user_id: user.id, ticket_id: ticket.id, quantity: qty }).subscribe({
      next: (res) => {
        this.reserving = false;
        this.router.navigate(['/confirmation'], { state: { order: res.order, qrCodeUrl: res.qrCodeUrl } });
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de la réservation/paiement';
        this.reserving = false;
      }
    });
  }

  // Décoder le JWT pour obtenir l'id utilisateur
  parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
