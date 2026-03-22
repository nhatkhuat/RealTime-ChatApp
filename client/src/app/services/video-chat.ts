import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class VideoChatService {
  private hubUrl = 'http://localhost:5000/hubs/video';
  public hubConnection!: HubConnection;
  public incomingCall = false;
  public isCallActive = false;
  public remoteUserId: string | null = null;
  public peerConnection!: RTCPeerConnection;
  public callEnded = new Subject<void>();
  private ringAudio?: HTMLAudioElement;

  public offerReceived = new BehaviorSubject<{ senderId: string, offer: RTCSessionDescriptionInit } | null>(null);
  public answerReceived = new BehaviorSubject<{ senderId: string, answer: RTCSessionDescription } | null>(null);
  public iceCandidateReceived = new BehaviorSubject<{ senderId: string, candidate: RTCIceCandidate } | null>(null);


  startConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('Connected to video chat hub'))
      .catch(err => console.error('Error connecting to video chat hub:', err));

    this.hubConnection.on('ReceiveOffer', (sender, offer) => {
      this.offerReceived.next({ senderId: sender, offer: JSON.parse(offer) });
    });

    this.hubConnection.on('ReceiveAnswer', (sender, answer) => {
      this.answerReceived.next({ senderId: sender, answer: JSON.parse(answer) });
    });

    this.hubConnection.on('ReceiveIceCandidate', (sender, iceCandidate) => {
      this.iceCandidateReceived.next({ senderId: sender, candidate: JSON.parse(iceCandidate) });
    });

    this.hubConnection.on('CallEnded', () => {
      this.callEnded.next();
    });

  }

  sendOffer(receiverId: string, offer: RTCSessionDescriptionInit) {
    this.hubConnection.invoke('SendOffer', receiverId, JSON.stringify(offer))
      .catch(err => console.error('Error sending offer:', err));
  }

  sendAnswer(receiverId: string, answer: RTCSessionDescriptionInit) {
    this.hubConnection.invoke('SendAnswer', receiverId, JSON.stringify(answer))
      .catch(err => console.error('Error sending answer:', err));
  }

  sendIceCandidate(receiverId: string, candidate: RTCIceCandidate) {
    this.hubConnection.invoke('SendIceCandidate', receiverId, JSON.stringify(candidate))
      .catch(err => console.error('Error sending ICE candidate:', err));
  }

  sendEndCall(receiverId: string) {
    if (this.hubConnection) {
      this.hubConnection.invoke('EndCall', receiverId)
        .catch(err => console.error('Error sending end call:', err));
    }
  }

  playRingTone() {
    this.stopRingTone();
    this.ringAudio = new Audio('/assets/ring.mp3');
    this.ringAudio.loop = true;
    this.ringAudio.play().catch(err => console.error('Error playing ring tone:', err));
  }

  stopRingTone() {
    if (!this.ringAudio) return;

    this.ringAudio.pause();
    this.ringAudio.currentTime = 0;
    this.ringAudio = undefined;
  }


}
