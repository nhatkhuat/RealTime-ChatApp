import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ChatService } from '../../services/chat';
import { User } from '../../models/user';
import { TypingIndicator } from "../typing-indicator/typing-indicator";

@Component({
  selector: 'app-chat-sidebar',
  imports: [MatButtonModule, MatIcon, MatMenuModule, TitleCasePipe, TypingIndicator],
  templateUrl: './chat-sidebar.html',
  styles: ``,
})
export class ChatSidebar implements OnInit {

  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.chatService.disconnect();
  }
  ngOnInit(): void {
    this.chatService.startConnection(this.authService.getAccessToken!);
  }

  openChatWindow(user: User) {
    // Clear previous chat messages when switching to a new user.
    // this.chatService.chatMessages.set([]);
    // this.chatService.isLoading.set(true);

    this.chatService.currentOpenedChat.set(user);
    this.chatService.loadMessages(1);
  }
}
