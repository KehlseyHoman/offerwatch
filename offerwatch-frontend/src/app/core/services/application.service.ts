import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Application } from '../models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private base = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Application[]> {
    return this.http.get<Application[]>(this.base);
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(`${this.base}/${id}`);
  }

  create(app: Partial<Application>): Observable<Application> {
    return this.http.post<Application>(this.base, app);
  }

  update(id: string, patch: Partial<Application>): Observable<Application> {
    return this.http.patch<Application>(`${this.base}/${id}`, patch);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
