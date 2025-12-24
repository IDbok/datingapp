import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageContainer, MessageService } from '../../core/services/message-service';
import { PaginatedResult } from '../../types/pagination';
import { Message } from '../../types/message';
import { Paginator } from "../../shared/paginator/paginator";
import { RouterLink } from "@angular/router";
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-messages',
  imports: [Paginator, RouterLink, DatePipe],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit {
  private messageService = inject(MessageService);
  protected container: MessageContainer = 'Inbox';
  protected fetchedContainer: MessageContainer = 'Inbox';
  protected pageNumber = 1;
  protected pageSize = 10;
  protected paginatedMessages = signal<PaginatedResult<Message> | null>(null);
  
  tabs = [
    { label: 'Inbox', container: 'Inbox' as MessageContainer },
    { label: 'Outbox', container: 'Outbox' as MessageContainer },
    // { label: 'Unread', container: 'Unread' as MessageContainer }
  ]

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.messageService.getMessages(this.container, this.pageNumber, this.pageSize).
      subscribe({
        next: (paginatedMessages) => {
          this.paginatedMessages.set(paginatedMessages);
          this.fetchedContainer = this.container;
        }
      });
  }

  deleteMessage(event: Event, messageId: string) {
    event.stopPropagation();
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        // this.loadMessages();
        const currentMessages = this.paginatedMessages();
        if (currentMessages) {
          this.paginatedMessages.update(prev => {
            if (!prev) return prev;

            const newMessages = prev.items.filter(m => m.id !== messageId);
            const newMetadata = prev.metadata
              ? (() => {
                  const totalCount = Math.max(prev.metadata.totalCount - 1, 0);
                  const totalPages = Math.max(1, Math.ceil(totalCount / prev.metadata.pageSize));
                  const currentPage = Math.min(prev.metadata.currentPage, totalPages);
                  return {
                    ...prev.metadata,
                    totalCount,
                    totalPages,
                    currentPage
                  };
                })()
              : prev.metadata;

            return {
              items: newMessages,
              metadata: newMetadata
            };
          })
        }
      }
    });
  }

  get isInbox() {
    return this.fetchedContainer === 'Inbox';
  }

  setContainer(container: MessageContainer) {
    this.container = container;
    this.pageNumber = 1;
    this.loadMessages();
  }

  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.pageNumber = event.page;
    this.loadMessages();
  }

}