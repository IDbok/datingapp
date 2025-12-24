import { Component, effect, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MessageService } from '../../../core/services/message-service';
import { MemberService } from '../../../core/services/member-service';
import { Message } from '../../../types/message';
import { DatePipe } from '@angular/common';
import { TimeAgoPipe } from '../../../core/pipes/time-ago-pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, TimeAgoPipe, FormsModule],
  templateUrl: './member-messages.html',
  styleUrl: './member-messages.css'
})
export class MemberMessages implements OnInit {
  @ViewChild('messageEndRef') messageEndRef!: ElementRef;
  private messageService = inject(MessageService);
  private memberService = inject(MemberService);
  protected messages = signal<Message[]>([]);
  protected messageContent = '';

  constructor() {
    effect(() => {
      if (this.messages().length > 0) {
        this.scrollToBottom();
      }
    });    
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    const memberId = this.memberService.member()?.id;
    if (!memberId) return;
    this.messageService.getMessageThread(memberId).subscribe(response => {
        this.messages.set(response.map(message => ({
          ...message,
          currentUserSender: message.senderId !== memberId
        })));
    });
  }

  sendMessage(): void {
    const recipientId = this.memberService.member()?.id;
    if (!recipientId || !this.messageContent.trim()) return;
    this.messageService.sendMessage(recipientId, this.messageContent).subscribe(message => {
      const newMessage: Message = { ...message, currentUserSender: true };
      this.messages.update(msgs => [...msgs, newMessage]);
        this.messageContent = '';
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageEndRef) {
        this.messageEndRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}