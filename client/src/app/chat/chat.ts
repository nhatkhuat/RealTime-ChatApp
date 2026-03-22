import { Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatWindow } from "../components/chat-window/chat-window";
import { ChatSidebar } from "../components/chat-sidebar/chat-sidebar";
import { ChatRightSidebar } from "../components/chat-right-sidebar/chat-right-sidebar";

@Component({
  selector: 'app-chat',
  imports: [MatIconModule, ChatWindow, ChatSidebar, ChatRightSidebar],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  sidebarOpen = signal(false);

  openSidebar() {
    this.sidebarOpen.set(true);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }
}
