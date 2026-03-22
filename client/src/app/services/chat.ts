import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { User } from '../models/user';
import { AuthService } from './auth-service';
// import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Message } from '../models/message';
import { Observable } from 'rxjs';

export interface MessagePayload {
  receiverId: string | null | undefined;
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'file' | null;
  attachmentName?: string | null;
}

export interface UploadedFile {
  url: string;
  fileName: string;
  contentType: string;
  attachmentType: 'image' | 'file';
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {

  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private hubUrl = 'http://localhost:5000/hubs/chat';
  private fileApiUrl = 'http://localhost:5000/api/files';
  onlineUsers: WritableSignal<User[]> = signal([]);
  currentOpenedChat: WritableSignal<User | null> = signal(null);
  chatMessages: WritableSignal<Message[]> = signal([]);
  isLoading: WritableSignal<boolean> = signal(true);
  currentPage = 1; // public để component chat-box truy cập
  private hubConnection?: HubConnection;
  private optimisticMessageSeed = 0;

  autoScrollEnabled: WritableSignal<boolean> = signal(true);

  startConnection(senderId?: string) {
    if (this.hubConnection?.state === HubConnectionState.Connected) return;

    if (this.hubConnection) {
      this.hubConnection.off('Notify');
      this.hubConnection.off('NotifyTyping');
      this.hubConnection.off('OnlineUsers');
      this.hubConnection.off('ReceiveMessageList');
      this.hubConnection.off('ReceiveNewMessage');
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?senderId=${senderId || ''}`, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('Connected to chat hub'))
      .catch(err => console.error('Error connecting to chat hub:', err));

    this.hubConnection.on('Notify', (user: User) => {
      Notification.requestPermission().then(permission => {
        if (permission == 'granted') {
          new Notification('Active now ❤️‍🔥' + user.userName, {
            body: user.userName + ' is online now',
            icon: user.profileImage
          });
        }
      });
    });

    this.hubConnection.on('NotifyTyping', (senderUserName: string) => {
      this.onlineUsers.update(
        users =>
          users.map(u => {
            if (u.userName === senderUserName) {
              u.isTyping = true;
            }
            return u;
          })
      );
      setTimeout(() => {
        this.onlineUsers.update(
          users =>
            users.map(u => {
              if (u.userName === senderUserName) {
                u.isTyping = false;
              }
              return u;
            })
        );
      }, 2000);
    });

    this.hubConnection.on('OnlineUsers', (user: User[]) => {
      this.onlineUsers.set(
        user.filter(u => u.userName !== this.authService.currentUser?.userName)
      );
    });
    this.hubConnection.on('ReceiveMessageList', (messages: Message[]) => {
      this.isLoading.set(true);

      const sortedMessages = [...messages].sort((a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      );

      if (this.currentPage > 1) {
        // cũ hơn lên trên
        this.chatMessages.update(existing => [...sortedMessages, ...existing]);
      } else {
        // trang 1
        this.chatMessages.set(sortedMessages);
      }

      this.isLoading.set(false);
    });


    this.hubConnection.on('ReceiveNewMessage', (message: Message) => {
      let audio = new Audio('/assets/notification.mp3');
      audio.play();

      document.title = '(1) New message';
      this.chatMessages.update(messages => [...messages, message]);
    });

  }

  disconnect() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('Disconnected from chat hub'))
        .catch(err => console.error('Error disconnecting from chat hub:', err));
    }
  }

  uploadFiles(files: File[]): Observable<UploadedFile[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return this.httpClient.post<UploadedFile[]>(`${this.fileApiUrl}/upload`, formData, {
      withCredentials: true
    });
  }

  sendMessage(payload: MessagePayload) {
    const content = payload.content?.trim() ?? '';
    if (!content && !payload.attachmentUrl) return;

    this.optimisticMessageSeed += 1;
    const optimisticId = Date.now() * 1000 + (this.optimisticMessageSeed % 1000);

    this.chatMessages.update(messages => {
      const newMessage: Message = {
        id: optimisticId,
        senderId: this.authService.currentUser?.id || null,
        receiverId: payload.receiverId || this.currentOpenedChat()?.id || null,
        content: content || null,
        attachmentUrl: payload.attachmentUrl || null,
        attachmentType: payload.attachmentType || null,
        attachmentName: payload.attachmentName || null,
        createdDate: new Date().toISOString(),
        isRead: false
      };
      return [...messages, newMessage];
    });

    this.hubConnection?.invoke('SendMessage', {
      receiverId: payload.receiverId || this.currentOpenedChat()?.id,
      content: content || null,
      attachmentUrl: payload.attachmentUrl || null,
      attachmentType: payload.attachmentType || null,
      attachmentName: payload.attachmentName || null
    }).catch(err => console.error('Error sending message:', err));

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
    this.currentPage = pageNumber;
    this.isLoading.set(true);
    this.hubConnection?.invoke("LoadMessages", this.currentOpenedChat()?.id, pageNumber)
      .then().catch(err => console.error('Error loading messages:', err))
      .finally(() => this.isLoading.set(false));
  }

  notifyTyping() {
    this.hubConnection?.invoke('NotifyTyping', this.currentOpenedChat()?.userName)
      .catch(err => console.error('Error notifying typing:', err));
  }

  resetPagination() {
    this.currentPage = 1;
  }
}
