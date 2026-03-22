import { Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { ChatBox } from "../chat-box/chat-box";
import { VideoChatService } from '../../services/video-chat';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from '../../video-chat/video-chat';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: [`:host { display: block; height: 100%; min-height: 0; }`],
})
export class ChatWindow implements OnInit {

  @ViewChild(ChatBox, { read: ElementRef }) chatContainer?: ElementRef;
  dialog = inject(MatDialog);
  chatService = inject(ChatService);
  signalRService = inject(VideoChatService);
  private destroyRef = inject(DestroyRef);
  message: string = '';

  ngOnInit(): void {
    this.signalRService.startConnection();

    this.signalRService.offerReceived
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (!data) return;

        this.signalRService.playRingTone();
        this.dialog.open(VideoChat, {
          width: '400px',
          height: '600px',
          disableClose: false,
          autoFocus: false
        });
        this.signalRService.incomingCall = true;
        this.signalRService.remoteUserId = data.senderId;
      });
  }

  sendMessage() {
    if (!this.message) return;
    this.chatService.autoScrollEnabled.set(true);
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
