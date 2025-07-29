import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  mode: 'login' | 'register' = 'login';
  loading = false;
  error = '';
  success = '';
  form: any = {
    name: '',
    email: '',
    password: '',
    telephone: '',
    role: 'user'
  };

  constructor(private api: ApiService, private router: Router) {}

  switchMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.error = '';
    this.success = '';
    this.form = {
      name: '',
      email: '',
      password: '',
      telephone: '',
      role: 'user'
    };
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = '';
    if (this.mode === 'login') {
      this.api.login({ email: this.form.email, password: this.form.password }).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          this.success = 'Connexion réussie !';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/']), 1000);
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur de connexion';
          this.loading = false;
        }
      });
    } else {
      this.api.register(this.form).subscribe({
        next: (res) => {
          this.success = 'Inscription réussie ! Connectez-vous.';
          this.loading = false;
          this.mode = 'login';
        },
        error: (err) => {
          this.error = err.error?.error || 'Erreur lors de l\'inscription';
          this.loading = false;
        }
      });
    }
  }
}
