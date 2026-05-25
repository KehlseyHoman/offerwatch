import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Note } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private base(appId: string) {
    return `${environment.apiUrl}/applications/${appId}/notes`;
  }

  constructor(private http: HttpClient) {}

  getAll(appId: string): Observable<Note[]> {
    return this.http.get<Note[]>(this.base(appId));
  }

  create(appId: string, body: string): Observable<Note> {
    return this.http.post<Note>(this.base(appId), { body });
  }

  delete(appId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(appId)}/${noteId}`);
  }
}
