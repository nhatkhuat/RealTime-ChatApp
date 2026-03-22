import { Component, DestroyRef, EventEmitter, computed, inject, OnInit, Output, signal } from '@angular/core';
import { MatButtonModule } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { ChatService } from '../../services/chat';
import { User } from '../../models/user';
import { TypingIndicator } from "../typing-indicator/typing-indicator";
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat-sidebar',
  imports: [MatButtonModule, MatIcon, MatMenuModule, TitleCasePipe, TypingIndicator],
  templateUrl: './chat-sidebar.html',
  styles: [`:host { display: block; height: 100%; min-height: 0; }`],
})
export class ChatSidebar implements OnInit {

  @Output() userSelected = new EventEmitter<void>();

  private destroyRef = inject(DestroyRef);
  authService = inject(AuthService);
  chatService = inject(ChatService);
  router = inject(Router);
  searchTerm = signal('');
  private searchInput$ = new Subject<string>();

  filteredUsers = computed(() => {
    const term = this.normalizeSearch(this.searchTerm());
    const users = this.chatService.onlineUsers();

    if (!term) {
      return users;
    }

    const tokens = term.split(' ').filter(Boolean);

    return users.filter(user => {
      const haystack = this.normalizeSearch(`${user.fullName} ${user.userName}`);
      return tokens.every(token => haystack.includes(token));
    });
  });

  logout() {
    this.chatService.currentOpenedChat.set(null);
    this.chatService.chatMessages.set([]);
    this.chatService.resetPagination();
    this.chatService.disconnect();
    this.authService.clearSession();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  ngOnInit(): void {
    this.chatService.currentOpenedChat.set(null);
    this.chatService.chatMessages.set([]);
    this.chatService.resetPagination();
    this.chatService.startConnection();

    this.searchInput$
      .pipe(
        debounceTime(180),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => this.searchTerm.set(value));
  }

  openChatWindow(user: User) {
    // reset lưu số trang khi chuyển chat mới
    this.chatService.resetPagination();
    this.chatService.chatMessages.set([]);
    this.chatService.isLoading.set(true);

    this.chatService.currentOpenedChat.set(user);
    this.chatService.loadMessages(1);
    this.userSelected.emit();
  }

  setSearchTerm(value: string) {
    this.searchInput$.next(value);
  }

  clearSearch() {
    this.searchInput$.next('');
    this.searchTerm.set('');
  }

  private normalizeSearch(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ' ')
      .replace(/\s+/g, ' ');
  }
}
