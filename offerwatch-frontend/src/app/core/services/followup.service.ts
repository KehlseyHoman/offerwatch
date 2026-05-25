import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Followup } from '../models/followup.model';

@Injectable({ providedIn: 'root' })
export class FollowupService {
  private base(appId: string) {
    return `${environment.apiUrl}/applications/${appId}/followups`;
  }

  constructor(private http: HttpClient) {}

  getAll(appId: string): Observable<Followup[]> {
    return this.http.get<Followup[]>(this.base(appId));
  }

  create(appId: string, payload: { reason?: string; dueDate?: string }): Observable<Followup> {
    return this.http.post<Followup>(this.base(appId), payload);
  }

  toggle(appId: string, followupId: string, completed: boolean): Observable<Followup> {
    return this.http.patch<Followup>(`${this.base(appId)}/${followupId}`, { completed });
  }

  delete(appId: string, followupId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(appId)}/${followupId}`);
  }
}
