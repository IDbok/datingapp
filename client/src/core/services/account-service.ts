import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginCreds, RegisterCreds, User } from '../../types/user';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LikesService } from './likes-service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private likesService = inject(LikesService);
  currentUser = signal<User | null>(null);
  private baseUrl = environment.apiUrl;

  register(creds: RegisterCreds) {
    return this.http.post<User>(this.baseUrl + 'account/register', creds,
      {withCredentials: true}
    ).pipe(
      tap(user => {
        if (user) { 
          this.setCurrentUser(user); 
          this.startTokenRefreshTimer();
        }
      })
    )

  }

  login(creds: LoginCreds) {
    return this.http.post<User>(this.baseUrl + 'account/login', creds,
      {withCredentials: true}
    ).pipe(
      tap(user => {
        if (user) { 
          this.setCurrentUser(user); 
          this.startTokenRefreshTimer();
        }
      })
    )
  }

  refreshToken() {
    return this.http.post<User>(this.baseUrl + 'account/refresh-token', {},
      {withCredentials: true}
    );
  }

  startTokenRefreshTimer() {
    setInterval(() => {
      this.http.post<User>(this.baseUrl + 'account/refresh-token', {},
        {withCredentials: true}
      ).subscribe({
        next: user => {
          this.setCurrentUser(user);
        },
        error: error => {
          console.error('Token refresh failed', error);
          this.logout();
        }
      });
    }, 5*60*1000)
  }

  setCurrentUser(user: User) {
    user.roles = this.getRolesFromToken(user.token);
    this.currentUser.set(user);
    this.likesService.getLikeIds();
  }

  logout() {
    localStorage.removeItem('filters');
    
    this.currentUser.set(null);
    this.likesService.clearLikeIds();
  }

  private getRolesFromToken(token: string): string[] {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Array.isArray(payload.role) ? payload.role : [payload.role];
  }
}
