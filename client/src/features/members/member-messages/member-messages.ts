import { Component, effect, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { MessageService } from '../../../core/services/message-service';
import { MemberService } from '../../../core/services/member-service';
import { Message } from '../../../types/message';
import { DatePipe } from '@angular/common';
import { TimeAgoPipe } from '../../../core/pipes/time-ago-pipe';
import { FormsModule } from '@angular/forms';
import { PresenceService } from '../../../core/services/presence-service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-member-messages',
  imports: [DatePipe, TimeAgoPipe, FormsModule],
  templateUrl: './member-messages.html',
  styleUrl: './member-messages.css'
})
export class MemberMessages implements OnInit, OnDestroy {
  @ViewChild('messageEndRef') messageEndRef!: ElementRef;
  private memberService = inject(MemberService);
  private route = inject(ActivatedRoute);
  protected messageService = inject(MessageService);
  protected presenceService = inject(PresenceService);
  protected messageContent = '';

  constructor() {
    effect(() => {
      if (this.messageService.messageThread().length > 0) {
        this.scrollToBottom();
      }
    });    
  }
  

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe({
      next: params => {
        const otherUserId = params.get('id');
        if (!otherUserId) throw new Error('Member ID not found in route parameters.');
        this.messageService.createHubConnection(otherUserId);
      }
    })
  }

  ngOnDestroy(): void {
    this.messageService.stopHubConnection();
  }

  sendMessage(): void {
    const recipientId = this.memberService.member()?.id;
    if (!recipientId || !this.messageContent.trim()) return;
    this.messageService.sendMessage(recipientId, this.messageContent)?.then(() => {
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
