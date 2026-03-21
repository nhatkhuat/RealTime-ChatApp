import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { ChatBox } from "../chat-box/chat-box";
import { VideoChatService } from '../../services/video-chat';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from '../../video-chat/video-chat';

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: ``,
})
export class ChatWindow {

  @ViewChild('chatBox') chatContainer?: ElementRef;
  dialog = inject(MatDialog);
  chatService = inject(ChatService);
  signalRService = inject(VideoChatService);
  message: string = '';

  sendMessage() {
    if (!this.message) return;
    this.chatService.sendMessage(this.message);
    this.message = '';
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    }
  }

  scrollToTop() {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop = 0;
    }
  }

  displayDialog(receiverId: string) {
    this.signalRService.remoteUserId = receiverId;
    this.dialog.open(VideoChat, {
      width: '400px',
      height: '600px',
      disableClose: true,
      autoFocus: false
    });

  }
}
