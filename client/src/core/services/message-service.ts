import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PaginatedResult } from '../../types/pagination';
import { Message } from '../../types/message';

export type MessageContainer = 'Inbox' | 'Outbox' | 'Unread';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + 'messages';

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
    return this.http.post<Message>(this.baseUrl, { recipientId, content });
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${this.baseUrl}/${messageId}`);
  }
}
