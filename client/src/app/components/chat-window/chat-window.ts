import { Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from "@angular/material/icon";
import { FormsModule } from '@angular/forms';
import { ChatBox } from "../chat-box/chat-box";
import { VideoChatService } from '../../services/video-chat';
import { MatDialog } from '@angular/material/dialog';
import { VideoChat } from '../../video-chat/video-chat';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

type PendingAttachment = {
  file: File;
  previewUrl: string | null;
  attachmentType: 'image' | 'file';
};

@Component({
  selector: 'app-chat-window',
  imports: [TitleCasePipe, MatIconModule, FormsModule, ChatBox],
  templateUrl: './chat-window.html',
  styles: [`:host { display: block; height: 100%; min-height: 0; }`],
})
export class ChatWindow implements OnInit, OnDestroy {

  private readonly maxFileSize = 10 * 1024 * 1024;

  @ViewChild(ChatBox, { read: ElementRef }) chatContainer?: ElementRef;
  dialog = inject(MatDialog);
  chatService = inject(ChatService);
  signalRService = inject(VideoChatService);
  private destroyRef = inject(DestroyRef);
  message: string = '';
  pendingAttachments: PendingAttachment[] = [];
  isUploading = false;

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

  ngOnDestroy(): void {
    this.clearPendingAttachments();
  }

  async sendMessage() {
    const trimmedMessage = this.message.trim();
    if (!trimmedMessage && this.pendingAttachments.length === 0) return;

    this.chatService.autoScrollEnabled.set(true);

    const receiverId = this.chatService.currentOpenedChat()?.id;
    if (!receiverId) return;

    if (trimmedMessage) this.chatService.sendMessage({ receiverId, content: trimmedMessage });

    if (this.pendingAttachments.length > 0) {
      this.isUploading = true;
      try {
        const uploaded = await firstValueFrom(this.chatService.uploadFiles(this.pendingAttachments.map(item => item.file)));
        uploaded.forEach(file => this.chatService.sendMessage({
          receiverId,
          attachmentUrl: file.url,
          attachmentType: file.attachmentType,
          attachmentName: file.fileName
        }));
      } catch (error) {
        console.error('Upload failed:', (error as any)?.error?.message || error);
        return;
      } finally {
        this.isUploading = false;
      }
    }

    this.message = '';
    queueMicrotask(() => this.clearPendingAttachments());
    this.scrollToBottom();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.addAttachments(files);
    input.value = '';
  }

  onPaste(event: ClipboardEvent) {
    if (!event.clipboardData) return;

    const files = Array.from(event.clipboardData.items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((file): file is File => !!file);

    if (files.length === 0) return;

    event.preventDefault();
    this.addAttachments(files);
  }

  removeAttachment(index: number) {
    const [item] = this.pendingAttachments.splice(index, 1);
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }

  private addAttachments(files: File[]) {
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > this.maxFileSize) {
        return;
      }

      const attachmentType: 'image' | 'file' = file.type.startsWith('image/') ? 'image' : 'file';
      this.pendingAttachments.push({
        file,
        attachmentType,
        previewUrl: attachmentType === 'image' ? URL.createObjectURL(file) : null
      });
    });
  }

  private clearPendingAttachments() {
    this.pendingAttachments.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    this.pendingAttachments = [];
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
