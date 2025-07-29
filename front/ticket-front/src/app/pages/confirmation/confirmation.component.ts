import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css']
})
export class ConfirmationComponent {
  order: any = null;
  qrCodeUrl: string = '';

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.order = nav.extras.state['order'];
      this.qrCodeUrl = nav.extras.state['qrCodeUrl'];
    }
  }
}
