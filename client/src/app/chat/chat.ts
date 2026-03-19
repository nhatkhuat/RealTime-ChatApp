import { Component } from '@angular/core';
import { ChatWindow } from "../components/chat-window/chat-window";
import { ChatSidebar } from "../components/chat-sidebar/chat-sidebar";
import { ChatRightSidebar } from "../components/chat-right-sidebar/chat-right-sidebar";

@Component({
  selector: 'app-chat',
  imports: [ChatWindow, ChatSidebar, ChatRightSidebar],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat { }
