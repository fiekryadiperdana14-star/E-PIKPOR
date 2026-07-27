import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SimulationInput,
  SimulationResult,
  Simulation,
  PaginatedResponse,
} from '../../shared/models/simulation.model';

@Injectable({
  providedIn: 'root',
})
export class SimulationService {
  private readonly API_URL = `${environment.apiUrl}/simulations`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new RBT simulation
   * This triggers the chain: Input → Pasal.id → Gemini AI → MySQL
   */
  createSimulation(input: SimulationInput): Observable<{ success: boolean; data: SimulationResult }> {
    return this.http.post<{ success: boolean; data: SimulationResult }>(this.API_URL, input);
  }

  /**
   * Get simulation history with pagination
   */
  getSimulations(
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
   * Get simulation detail by ID
   */
  getSimulationDetail(id: number, lang: string = 'id'): Observable<{ success: boolean; data: Simulation }> {
    const params = new HttpParams().set('lang', lang);
    return this.http.get<{ success: boolean; data: Simulation }>(`${this.API_URL}/${id}`, { params });
  }

  /**
   * Get dashboard statistics
   */
  getSimulationStats(): Observable<{ success: boolean; data: { total: number; completed: number; processing: number } }> {
    return this.http.get<{ success: boolean; data: { total: number; completed: number; processing: number } }>(`${this.API_URL}/stats`);
  }

  /**
   * Save simulation evaluation
   */
  saveEvaluation(id: number, payload: { skor_akhir: number, penilaian_tambahan: number, evaluasi_mandiri: string, checked_evaluations: any }): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.API_URL}/${id}/evaluate`, payload);
  }

  /**
   * Get recent legal references
   */
  getLegalReferences(limit: number = 10): Observable<{ success: boolean, data: any[] }> {
    return this.http.get<{ success: boolean, data: any[] }>(`${this.API_URL}/legal-references`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }
}
