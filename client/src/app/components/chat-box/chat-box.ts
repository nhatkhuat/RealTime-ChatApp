import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth-service';
import { DatePipe } from '@angular/common';
import { MatIconModule, MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinner, DatePipe, MatIconModule, MatIcon],
  templateUrl: './chat-box.html',
  styles: ``,
})
export class ChatBox {
  chatService = inject(ChatService);
  authService = inject(AuthService);



}
