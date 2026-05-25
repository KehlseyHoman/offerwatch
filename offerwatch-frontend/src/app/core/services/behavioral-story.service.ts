import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BehavioralStory } from '../models/behavioral-story.model';

@Injectable({ providedIn: 'root' })
export class BehavioralStoryService {
  private readonly url = `${environment.apiUrl}/behavioral-stories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<BehavioralStory[]> {
    return this.http.get<BehavioralStory[]>(this.url);
  }

  create(req: Partial<BehavioralStory>): Observable<BehavioralStory> {
    return this.http.post<BehavioralStory>(this.url, req);
  }

  update(id: string, patch: Partial<BehavioralStory>): Observable<BehavioralStory> {
    return this.http.patch<BehavioralStory>(`${this.url}/${id}`, patch);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
