import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './app-layout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app-layout.scss',
})
export class AppLayoutComponent {
  constructor(private auth: AuthService) {}

  get userName(): string {
    return this.auth.currentUser()?.name ?? 'there';
  }
  logout(): void {
    this.auth.logout();
  }
}
