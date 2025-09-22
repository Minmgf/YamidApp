import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EvaluationRequest {
  evaluado_id: number;
  evaluador_id: number;
  calificacion: number;
  comentario: string;
}

export interface EvaluationResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Envía una evaluación al endpoint
   */
  submitEvaluation(evaluation: EvaluationRequest): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(`${this.apiUrl}/evaluaciones`, evaluation, {
      headers: this.getAuthHeaders()
    });
  }
}
