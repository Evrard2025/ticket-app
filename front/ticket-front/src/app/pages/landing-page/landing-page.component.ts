import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  featuredEvents: any[] = [];
  currentIndex = 0;
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getEvents().subscribe({
      next: (data) => {
        this.featuredEvents = data.slice(0, 5); // 5 événements à la une
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.featuredEvents.length) % this.featuredEvents.length;
  }
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.featuredEvents.length;
  }
} 