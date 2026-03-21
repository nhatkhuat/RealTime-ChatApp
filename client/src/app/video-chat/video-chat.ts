import { Component, DestroyRef, ElementRef, inject, ViewChild } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { VideoChatService } from '../services/video-chat';
import { MatDialogRef } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-video-chat',
  imports: [MatIconModule, MatSnackBarModule],
  template: `
  <div class="relative h-full w-full">
      <video class="w-32 absolute right-5 top-4 h-52 object-cover border-red-500 border-2 rounded-lg"
      #localVideo autoplay playsInline></video>
      <video class="w-full h-full object-cover bg-slate-800"
      #remoteVideo autoplay playsInline></video>
      <div class="absolute bottom-10 left-0 right-0 2-50 flex justify-center space-x-3 p-4">
        @if(signalRService.incomingCall){
            <button
            class="bg-green-500 flex items-center gap-2 hover:bg-gray-700
            shadow-xltext-white font-bold py-2 bx-4 rounded-full"
            (click)="acceptCall()"
            >
              <mat-icon>
              call
              </mat-icon>
            Accept
            </button>

            <button
            class="bg-red-500 flex items-center gap-2 hover:bg-gray-700
            shadow-xltext-white font-bold py-2 bx-4 rounded-full"
            (click)="declineCall()"
            >
              <mat-icon>
              call_end
              </mat-icon>
            Decline
            </button>
                  }
          @if(!signalRService.incomingCall && !this.signalRService.isCallActive){
              <button
              class="bg-green-500 flex items-center gap-2 hover:bg-gray-700
              shadow-xl text-white font-bold py-2 px-4 rounded-full"
              (click)="startCall()"
              >
                <mat-icon>
                call
                </mat-icon>
              Start Call
              </button>
          }
          @if(!signalRService.incomingCall && this.signalRService.isCallActive){
              <button
              class="bg-red-500 flex items-center gap-2 hover:bg-red-900
              shadow-xl text-white font-bold py-2 px-4 rounded-full"
              (click)="endCall()"
              >
                <mat-icon>
                call_end
                </mat-icon>
              End Call
              </button>
          }

      </div>
    </div>
  `,
  styles: ``,
})
export class VideoChat {
  @ViewChild("localVideo") localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild("remoteVideo") remoteVideo!: ElementRef<HTMLVideoElement>;
  private peerConnection!: RTCPeerConnection;
  signalRService = inject(VideoChatService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  private dialogRef: MatDialogRef<VideoChat> = inject(MatDialogRef);

  ngOnInit(): void {
    this.setupPeerConnection();
    this.setupSignalListers();
    this.startLocalVideo();
  }
  setupSignalListers() {
    this.signalRService.callEnded
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.handleCallEnded('The call has ended.');
      });

    this.signalRService.answerReceived
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (data) => {
        if (!data) return;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      });

    this.signalRService.iceCandidateReceived
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (data) => {
        if (!data) return;
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      });
  }

  declineCall() {
    const receiverId = this.signalRService.remoteUserId;
    if (receiverId) {
      this.signalRService.sendEndCall(receiverId);
    }
    this.handleCallEnded('The call was declined.');
  }

  async acceptCall() {
    this.signalRService.stopRingTone();
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = true;
    let offer = this.signalRService.offerReceived.value?.offer;
    if (offer) {
      this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return this.peerConnection.createAnswer();
      }).then(answer => {
        return this.peerConnection.setLocalDescription(answer);
      }).then(() => {
        this.signalRService.sendAnswer(this.signalRService.remoteUserId!, this.peerConnection.localDescription!);
      }).catch(err => console.error('Error handling offer:', err));
    }

  }

  async startCall() {
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = true;

    let offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.signalRService.sendOffer(this.signalRService.remoteUserId!, offer);
  }

  setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' }
      ]
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalRService.sendIceCandidate(this.signalRService.remoteUserId!, event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteVideo.nativeElement.srcObject = event.streams[0];
    };

  }
  async startLocalVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = stream;
    stream.getTracks().forEach(track => this.peerConnection.addTrack(track, stream));
  }

  async endCall() {
    const confirmed = confirm('Are you sure you want to end the call?');
    if (!confirmed) return;

    const receiverId = this.signalRService.remoteUserId;

    if (receiverId) {
      this.signalRService.sendEndCall(receiverId);
    }

    this.handleCallEnded('The call has ended.');

  }

  private handleCallEnded(message: string) {
    this.signalRService.stopRingTone();
    this.signalRService.offerReceived.next(null);
    this.signalRService.incomingCall = false;
    this.signalRService.isCallActive = false;
    this.signalRService.remoteUserId = null;

    const stream = this.localVideo.nativeElement.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;

    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.close();
    }

    this.snackBar.open(message, 'Close', { duration: 2500 });

    this.dialogRef.close();
  }
}
