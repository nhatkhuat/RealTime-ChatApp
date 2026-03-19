import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { User } from '../models/user';
import { AuthService } from './auth-service';
// import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Message } from '../models/message';

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private authService = inject(AuthService);
  private hubUrl = 'http://localhost:5000/hubs/chat';
  onlineUsers: WritableSignal<User[]> = signal([]);
  currentOpenedChat: WritableSignal<User | null> = signal(null);
  chatMessages: WritableSignal<Message[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(true);
  private hubConnection?: HubConnection;

  startConnection(token: string, senderId?: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?senderId=${senderId || ''}`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('Connected to chat hub'))
      .catch(err => console.error('Error connecting to chat hub:', err));

    this.hubConnection.on('OnlineUsers', (user: User[]) => {
      console.log('Received online users:', user);
      this.onlineUsers.set(
        user.filter(u => u.userName !== this.authService.currentUser?.userName)
      );
    });

    this.hubConnection.on('ReceiveMessageList', (messages: Message[]) => {
      // Replace the current message list with the one received from the server.
      // The server sends the full conversation for the selected chat.
      this.chatMessages.set(messages);
      this.isLoading.set(false);
    });
  }

  disconnect() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('Disconnected from chat hub'))
        .catch(err => console.error('Error disconnecting from chat hub:', err));
    }
  }
  status(userName: string): string {
    const currentChatUser = this.currentOpenedChat();
    if (!currentChatUser) {
      return 'offline';
    }
    const onlineUser = this.onlineUsers().find(u => u.userName === userName);
    return onlineUser?.isTyping ? 'Typing...' : this.isUserOnline();
  }
  isUserOnline(): string {
    let onlineUser = this.onlineUsers().find(u => u.userName === this.currentOpenedChat()?.userName);
    return onlineUser?.isOnline ? 'online' : this.currentOpenedChat()!.userName;
  }

  loadMessages(pageNumber: number) {
    this.hubConnection?.invoke("LoadMessages", this.currentOpenedChat()?.id, pageNumber)
      .then().catch(err => console.error('Error loading messages:', err))
      .finally(() => this.isLoading.set(false));
  }
}
