import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { DatePipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, FormsModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  filterDate = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des événements';
        this.loading = false;
      }
    });
  }

  get filteredEvents() {
    return this.events.filter(event => {
      const matchesSearch = this.searchTerm.trim() === '' ||
        event.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDate = !this.filterDate || event.date.startsWith(this.filterDate);
      return matchesSearch && matchesDate;
    });
  }
}
