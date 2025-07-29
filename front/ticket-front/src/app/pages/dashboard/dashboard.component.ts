import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  events: any[] = [];
  loading = true;
  error = '';
  showForm = false;
  editEvent: any = null;
  form: any = { title: '', description: '', date: '', image_url: '' };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.api.getEvents().subscribe({
      next: (data) => { this.events = data; this.loading = false; },
      error: (err) => { this.error = err.error?.message || 'Erreur chargement événements'; this.loading = false; }
    });
  }

  openForm(event: any = null) {
    this.showForm = true;
    this.editEvent = event;
    this.form = event ? { ...event } : { title: '', description: '', date: '', image_url: '' };
  }

  closeForm() {
    this.showForm = false;
    this.editEvent = null;
    this.form = { title: '', description: '', date: '', image_url: '' };
  }

  submitForm() {
    if (this.editEvent) {
      this.api.updateEvent(this.editEvent.id, this.form).subscribe({
        next: () => { this.closeForm(); this.loadEvents(); },
        error: (err) => { this.error = err.error?.message || 'Erreur modification'; }
      });
    } else {
      this.api.createEvent(this.form).subscribe({
        next: () => { this.closeForm(); this.loadEvents(); },
        error: (err) => { this.error = err.error?.message || 'Erreur création'; }
      });
    }
  }

  deleteEvent(id: number) {
    if (confirm('Supprimer cet événement ?')) {
      this.api.deleteEvent(id).subscribe({
        next: () => this.loadEvents(),
        error: (err) => { this.error = err.error?.message || 'Erreur suppression'; }
      });
    }
  }
}
