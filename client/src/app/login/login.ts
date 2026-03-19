
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, FormsModule, MatIconModule, MatInputModule, MatButtonModule, MatSnackBarModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email: string = '';
  password: string = '';

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  hide = signal(false);
  router = inject(Router);


  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.authService.me().subscribe();
        this.snackBar.open('Login successful', 'Close', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        const err = error.error as ApiResponse<string>;
        this.snackBar.open(`Login failed: ${err.error}`, 'Close', { duration: 5000 });
      },
      complete: () => {
        this.router.navigate(['/']);
      }
    });
  }

  togglePassword(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
}
