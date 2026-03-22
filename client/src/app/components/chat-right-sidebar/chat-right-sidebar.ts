import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-chat-right-sidebar',
  imports: [TitleCasePipe],
  templateUrl: './chat-right-sidebar.html',
  styles: [`:host { display: block; height: 100%; min-height: 0; }`],
})
export class ChatRightSidebar {
  chatService = inject(ChatService);


}
