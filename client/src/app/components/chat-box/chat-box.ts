import { AfterViewChecked, Component, ElementRef, inject, ViewChild, viewChild } from '@angular/core';
import { ChatService } from '../../services/chat';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth-service';
import { DatePipe } from '@angular/common';
import { MatIconModule, MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinner, DatePipe, MatIconModule, MatIcon],
  templateUrl: './chat-box.html',
  styles: [`
    .chat-box{
      scroll-behavior: smooth;
     padding: 10px;
     background-color: #f5f5f5;
     display: flex;
     flex-direction: column;
     box-shadow: 0 0 10px rgba(0,0,0,0.1);
     height: 70vh;
     border-radius: 5px;
     overflow-y: auto;
    }
    .chat-box::-webkit-scrollbar{
      width:5px;
      transition:width 0.3s
    }
    .chat-box:hover::-webkit-scrollbar{
      width:5px;
    }
    .chat-box::-webkit-scrollbar-track{
      background-color: transparent;
      border-radius:10px;
    }
    .chat-box:hover::-webkit-scrollbar-thumb {
      background:gray;
      border-radius:10px;
    }
    .chat-box::-webkit-scrollbar-thumb:hover {
      background:#555;
      border-radius:10px;
    }
    .chat-icon{
      width:40px;
      height:40px;
      font-size:48px;
      }
    `],
})
export class ChatBox implements AfterViewChecked {

  @ViewChild('chatBox', { read: ElementRef }) public chatBox?: ElementRef;

  chatService = inject(ChatService);
  authService = inject(AuthService);

  loadMoreMessages() {
    this.chatService.loadMessages(this.chatService.currentPage + 1);
    this.scrollToTop();
  }

  ngAfterViewChecked(): void {
    if (this.chatService.autoScrollEnabled()) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    this.chatService.autoScrollEnabled.set(true);
    this.chatBox?.nativeElement.scrollTo({
      top: this.chatBox.nativeElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  scrollToTop(): void {
    this.chatService.autoScrollEnabled.set(false);
    this.chatBox?.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
