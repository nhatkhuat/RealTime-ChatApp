import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { VideoChatService } from './services/video-chat';
import { AuthService } from './services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from './video-chat/video-chat';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('client');

  private signalRService = inject(VideoChatService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    if (!this.authService.getAccessToken) return;
    this.signalRService.startConnection();
    this.startOfferReceive();
  }

  startOfferReceive() {
    this.signalRService.offerReceived.subscribe(async (data) => {
      if (data) {
        this.signalRService.playRingTone();
        this.dialog.open(VideoChat, {
          width: '400px',
          height: '600px',
          disableClose: false

        });
        this.signalRService.incomingCall = true;
        this.signalRService.remoteUserId = data.senderId;
      }
    });
  }

}
