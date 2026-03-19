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
  selector: 'app-register',
  standalone: true,
  imports: [MatFormFieldModule, FormsModule, MatIconModule, MatInputModule, MatButtonModule, MatSnackBarModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})

export class Register {
  email: string = '';
  password: string = '';
  fullName: string = '';
  userName: string = '';
  profilePicture: string = 'https://randomuser.me/api/portraits/lego/1.jpg';
  profileImage: File | null = null;

  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  hide = signal(false);
  router = inject(Router);

  togglePassword(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.profileImage = file;
    this.profilePicture = URL.createObjectURL(file);
  }

  register() {
    const formData = new FormData();
    // Identity requires a unique username - use the email if none is provided.
    formData.append('username', this.userName || this.email);
    formData.append('fullName', this.fullName);
    formData.append('email', this.email);
    formData.append('password', this.password);

    if (this.profileImage) {
      formData.append('profileImage', this.profileImage, this.profileImage.name);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.snackBar.open('Registered successfully', 'Close', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        const err = error.error as ApiResponse<string>;
        this.snackBar.open(`Registration failed: ${err.error}`, 'Close', { duration: 5000 });
      },
      complete: () => {
        this.router.navigate(['/']);
      }
    });
  }
}

