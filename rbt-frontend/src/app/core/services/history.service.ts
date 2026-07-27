import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Simulation, PaginatedResponse } from '../../shared/models/simulation.model';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private readonly API_URL = `${environment.apiUrl}/simulations`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated simulation history
   */
  getHistory(
    page: number = 1,
    limit: number = 10,
    spesialisasi?: string
  ): Observable<PaginatedResponse<Simulation>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (spesialisasi) {
      params = params.set('spesialisasi', spesialisasi);
    }

    return this.http.get<PaginatedResponse<Simulation>>(this.API_URL, { params });
  }

  /**
   * Get full simulation detail
   */
  getDetail(id: number): Observable<{ success: boolean; data: Simulation }> {
    return this.http.get<{ success: boolean; data: Simulation }>(`${this.API_URL}/${id}`);
  }
}
