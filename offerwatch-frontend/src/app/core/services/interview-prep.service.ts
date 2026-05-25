import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InterviewPrep } from '../models/interview-prep.model';

@Injectable({ providedIn: 'root' })
export class InterviewPrepService {
  private readonly url = `${environment.apiUrl}/interview-prep`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InterviewPrep[]> {
    return this.http.get<InterviewPrep[]>(this.url);
  }

  create(req: { category: string; question: string; notes?: string }): Observable<InterviewPrep> {
    return this.http.post<InterviewPrep>(this.url, req);
  }

  update(id: string, patch: Partial<Pick<InterviewPrep, 'category' | 'question' | 'notes'>>): Observable<InterviewPrep> {
    return this.http.patch<InterviewPrep>(`${this.url}/${id}`, patch);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
