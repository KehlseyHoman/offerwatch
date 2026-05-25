import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contact } from '../models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private base(appId: string) {
    return `${environment.apiUrl}/applications/${appId}/contacts`;
  }

  constructor(private http: HttpClient) {}

  getAll(appId: string): Observable<Contact[]> {
    return this.http.get<Contact[]>(this.base(appId));
  }

  create(appId: string, contact: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(this.base(appId), contact);
  }

  update(appId: string, contactId: string, patch: Partial<Contact>): Observable<Contact> {
    return this.http.patch<Contact>(`${this.base(appId)}/${contactId}`, patch);
  }

  delete(appId: string, contactId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(appId)}/${contactId}`);
  }
}
