import { AfterViewChecked, Component, ElementRef, inject, ViewChild } from '@angular/core';
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
    :host{
      display:block;
      height:100%;
      min-height:0;
    }
    .chat-box{
      scroll-behavior: smooth;
     padding: 1rem;
     background: linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(241,245,249,0.98) 100%);
     display: flex;
     flex-direction: column;
     box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 30px rgba(15,23,42,0.05);
     height: 100%;
     min-height: 0;
     border-radius: 1.5rem;
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
      width:48px;
      height:48px;
      font-size:56px;
      }
    `],
})
export class ChatBox implements AfterViewChecked {

  @ViewChild('chatBox', { read: ElementRef }) public chatBox?: ElementRef;

  chatService = inject(ChatService);
  authService = inject(AuthService);
  isAtTop = true;

  loadMoreMessages() {
    this.chatService.loadMessages(this.chatService.currentPage + 1);
    this.scrollToTop();
  }

  onScroll(): void {
    if (!this.chatBox) return;
    const el = this.chatBox.nativeElement;
    const atTop = el.scrollTop <= 10;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;

    this.isAtTop = atTop;
    this.chatService.autoScrollEnabled.set(atBottom);
  }

  ngAfterViewChecked(): void {
    if (this.chatService.autoScrollEnabled()) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
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
