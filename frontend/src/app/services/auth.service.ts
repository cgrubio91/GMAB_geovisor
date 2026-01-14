import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Verificar si hay sesión activa
    this.verifySession();
  }

  /**
   * Login con código de acceso
   */
  login(code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/access-code`, { code })
      .pipe(
        tap(response => {
          // Guardar token y usuario en localStorage
          this.setToken(response.access_token);
          this.setUser(response.user);
          this.currentUserSubject.next(response.user);
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error;
        })
      );
  }

  /**
   * Logout - Cierra la sesión
   */
  logout(): Observable<any> {
    const token = this.getToken();
    
    if (!token) {
      this.clearSession();
      this.router.navigate(['/login']);
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.clearSession();
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          console.error('Logout error:', error);
          // Limpiar sesión aunque falle el logout
          this.clearSession();
          this.router.navigate(['/login']);
          return of(null);
        })
      );
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Observable<User> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No hay token disponible');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<User>(`${this.apiUrl}/me`, { headers })
      .pipe(
        tap(user => {
          this.setUser(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Verificar si hay sesión activa
   */
  verifySession(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    
    if (token && user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUserFromStorage();
  }

  /**
   * Obtener usuario actual (sincrónico)
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  // ============ Métodos privados ============

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private setUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.currentUserSubject.next(null);
  }
}
