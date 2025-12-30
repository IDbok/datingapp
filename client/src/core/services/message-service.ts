import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { PaginatedResult } from '../../types/pagination';
import { Message } from '../../types/message';
import { AccountService } from './account-service';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

export type MessageContainer = 'Inbox' | 'Outbox' | 'Unread';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private hubUrl = environment.hubUrl + 'messages';
  private baseUrl = environment.apiUrl + 'messages';
  private accountService = inject(AccountService);
  private hubConnection?: HubConnection;
  messageThread = signal<Message[]>([]);

  createHubConnection(otherUserId: string) {
    const currentUser = this.accountService.currentUser();
    if (!currentUser) return;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.hubUrl}?userId=${otherUserId}`, {
      accessTokenFactory: () => currentUser.token
    })
    .withAutomaticReconnect()
    .build();

    this.hubConnection.start()
      .catch(error => console.log(error));

    this.hubConnection.on('ReceiveMessageThread', (messages: Message[]) => {
      this.messageThread.set(messages.map( message => ({
        ...message,
        currentUserSender: message.senderId === currentUser.id
      })));
    });

    this.hubConnection.on('NewMessage', (message: Message) => {
      const newMessage: Message = { ...message, currentUserSender: message.senderId === currentUser.id };
      this.messageThread.update(msgs => [...msgs, newMessage]);
    });
  }

  stopHubConnection() {
    if(this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop()
        .catch(error => console.log(error));
    }
  }

  getMessages(container: MessageContainer, pageNumber: number, pageSize: number) {
    let params = new HttpParams();

    params = params.append('pageNumber', pageNumber.toString());
    params = params.append('pageSize', pageSize.toString());
    params = params.append('container', container);

    return this.http.get<PaginatedResult<Message>>(this.baseUrl, { params });
  }

  getMessageThread(recipientId: string) {
    return this.http.get<Message[]>(`${this.baseUrl}/thread/${recipientId}`);
  }

  sendMessage(recipientId: string, content: string) {
    return this.hubConnection?.invoke('SendMessage', { recipientId, content });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${this.baseUrl}/${messageId}`);
  }
}
