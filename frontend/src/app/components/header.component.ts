import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">🗺️ Geovisor</h1>
        </div>
        
        <div class="header-right">
          <div class="user-info" *ngIf="currentUser">
            <span class="user-name">{{ currentUser.full_name }}</span>
            <span class="user-role" *ngIf="currentUser.is_admin">👨‍💼 Admin</span>
          </div>
          
          <button class="btn-logout" (click)="logout()" title="Cerrar sesión">
            🚪 Salir
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      background: linear-gradient(90deg, var(--secondary) 0%, #2a5a92 100%);
      color: white;
      padding: 15px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
    }
    .app-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: white;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .user-name {
      font-weight: 600;
    }
    .user-role {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .btn-logout {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: rgba(255,255,255,0.3);
      border-color: rgba(255,255,255,0.5);
    }
    .btn-logout:active {
      transform: scale(0.98);
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
        }
      });
    }
  }
}
