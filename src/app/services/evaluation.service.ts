import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvaluationRequest {
  lider_id: number;
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
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Envía una evaluación al endpoint
   */
  submitEvaluation(evaluation: EvaluationRequest): Observable<EvaluationResponse> {
    return this.http.post<EvaluationResponse>(`${this.apiUrl}/evaluaciones`, evaluation);
  }
}
