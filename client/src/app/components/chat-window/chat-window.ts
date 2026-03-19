import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { ChatBox } from "../chat-box/chat-box";

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: ``,
})
export class ChatWindow {
  chatService = inject(ChatService);
  message: string = '';

  sendMessage() {
    // Implement the logic to send a message using the chat service
    console.log('Sending message:', this.message);
    // Clear the input after sending
    this.message = '';
  }

}
