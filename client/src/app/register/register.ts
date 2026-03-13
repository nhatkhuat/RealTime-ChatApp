import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  email: string = '';
  password: string = '';
  fullName: string = '';
  profilePicture: string = '';
  profileImage: File | null = null;

  authService = inject(AuthService);
}
