import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { User } from '../models/user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = `${environment.apiBaseUrl}/api/account`;
  private httpClient = inject(HttpClient);
  private currentUserSignal = signal<User | null>(null);
  private sessionLoaded = signal(false);
  isLoading = signal(false);

  register(data: FormData): Observable<ApiResponse<string>> {
    return this.httpClient
      .post<ApiResponse<string>>(`${this.baseUrl}/register`, data, { withCredentials: true })
      .pipe(
        tap(() => { })
      );
  }
  login(email: string, password: string): Observable<ApiResponse<string>> {
    return this.httpClient
      .post<ApiResponse<string>>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(() => {
          this.sessionLoaded.set(false);
        })
      );
  }

  me(): Observable<ApiResponse<User>> {
    return this.httpClient
      .get<ApiResponse<User>>(`${this.baseUrl}/me`, { withCredentials: true })
      .pipe(
        tap((response) => {
          if (response.isSuccess) {
            this.currentUserSignal.set(response.data);
            this.sessionLoaded.set(true);
          }
        })
      );
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  clearSession() {
    this.currentUserSignal.set(null);
    this.sessionLoaded.set(true);
  }

  ensureSession(): Observable<User | null> {
    if (this.sessionLoaded()) {
      return of(this.currentUserSignal());
    }

    return this.me().pipe(
      map((response) => response.isSuccess ? response.data : null),
      catchError(() => of(null)),
      tap((user) => {
        this.currentUserSignal.set(user);
        this.sessionLoaded.set(true);
      })
    );
  }

  logout() {
    this.httpClient.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  get currentUser(): User | null {
    return this.currentUserSignal();
  }
}
