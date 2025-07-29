import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.api.getProfile(token).subscribe({
        next: (user) => {
          this.user = user;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur lors du chargement du profil';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Utilisateur non authentifié';
      this.loading = false;
    }
  }
}

export default ProfileComponent; 