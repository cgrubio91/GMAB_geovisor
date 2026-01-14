import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card card">
        <div class="login-header">
          <div class="logo">
             <img src="assets/logo.png" alt="Logo" onerror="this.src='https://placehold.co/60x60?text=G'">
          </div>
          <h1>Geovisor</h1>
          <p>Ingresa tu código de acceso para continuar</p>
        </div>
        
        <form (submit)="login($event)">
          <div class="form-group">
            <label for="code">Código de Acceso</label>
            <input 
              type="text" 
              id="code" 
              [(ngModel)]="accessCode" 
              name="code" 
              placeholder="Ej: GEO-XXXX-XX"
              class="form-control"
              [disabled]="isLoading">
          </div>
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
            {{ isLoading ? 'Autenticando...' : 'Ingresar' }}
          </button>
        </form>
        
        <div *ngIf="error" class="error-msg">
          ❌ {{ error }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--secondary) 0%, #2a5a92 100%);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
      text-align: center;
    }
    .login-header h1 {
      margin: 15px 0 5px;
      color: var(--secondary);
    }
    .login-header p {
      color: var(--gray-600);
      font-size: 0.9rem;
      margin-bottom: 30px;
    }
    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--secondary);
    }
    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid var(--gray-200);
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
    }
    .form-control:disabled {
      background-color: var(--gray-100);
      cursor: not-allowed;
    }
    .btn-block {
      width: 100%;
      justify-content: center;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-msg {
      margin-top: 15px;
      color: #dc3545;
      font-size: 0.85rem;
      padding: 10px;
      background: rgba(220, 53, 69, 0.1);
      border-radius: 4px;
    }
  `]
})
export class LoginComponent {
  accessCode = '';
  error = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  login(event: Event) {
    event.preventDefault();

    if (!this.accessCode.trim()) {
      this.error = 'Ingresa un código de acceso válido';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.accessCode).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.detail || 'Error al autenticar. Intenta nuevamente.';
      }
    });
  }
}

