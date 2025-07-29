import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api'; // adapte si besoin

  constructor(private http: HttpClient) {}

  // Auth
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }
  getProfile(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  // Events
  getEvents(): Observable<any> {
    return this.http.get(`${this.baseUrl}/events`);
  }
  getEvent(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/events/${id}`);
  }
  createEvent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/events`, data);
  }
  updateEvent(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/events/${id}`, data);
  }
  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/events/${id}`);
  }

  // Tickets
  getTickets(eventId?: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/tickets`, { params: eventId ? { event_id: eventId } : {} });
  }

  // Orders
  getOrders(userId?: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/orders`, { params: userId ? { user_id: userId } : {} });
  }
  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders`, data);
  }

  // Payment
  pay(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/payment`, data);
  }
} 