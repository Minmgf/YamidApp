import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AgendaEvento {
  id?: number;
  agenda_id?: number;
  nombre_evento: string;
  fecha_evento: string; // Nueva propiedad para la fecha específica del evento
  hora: string;
  lugar: string;
  created_at?: string;
  updated_at?: string;
}

export interface Agenda {
  id?: number;
  municipio_id: number;
  fecha: string;
  nota_asesor?: string;
  created_at?: string;
  updated_at?: string;
  eventos?: AgendaEvento[];
}

export interface AgendaResponse {
  success: boolean;
  message: string;
  data?: Agenda | Agenda[];
}

export interface EventoResponse {
  success: boolean;
  message: string;
  data?: AgendaEvento;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtiene las agendas de un municipio específico
   */
  getAgendasByMunicipio(municipioId: number): Observable<AgendaResponse | Agenda[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<AgendaResponse | Agenda[]>(`${this.apiUrl}/agendas/${municipioId}`, { headers });
  }

  /**
   * Obtiene los eventos de una agenda específica
   */
  getEventosByAgenda(agendaId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/agendas/${agendaId}/eventos`, { headers });
  }

  /**
   * Crea una nueva agenda (solo para administradores)
   */
  crearAgenda(agenda: Omit<Agenda, 'id' | 'created_at' | 'updated_at'>): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AgendaResponse>(`${this.apiUrl}/agendas`, agenda, { headers });
  }

  /**
   * Agrega un evento a una agenda (solo para administradores)
   */
  agregarEvento(agendaId: number, evento: Omit<AgendaEvento, 'id' | 'agenda_id' | 'created_at' | 'updated_at'>): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<EventoResponse>(`${this.apiUrl}/agendas/${agendaId}/eventos`, evento, { headers });
  }

  /**
   * Actualiza una agenda (solo para administradores)
   */
  actualizarAgenda(agendaId: number, agenda: Partial<Agenda>): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<AgendaResponse>(`${this.apiUrl}/agendas/${agendaId}`, agenda, { headers });
  }

  /**
   * Elimina una agenda (solo para administradores)
   */
  eliminarAgenda(agendaId: number): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<AgendaResponse>(`${this.apiUrl}/agendas/${agendaId}`, { headers });
  }

  /**
   * Elimina un evento (solo para administradores)
   */
  eliminarEvento(agendaId: number, eventoId: number): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<EventoResponse>(`${this.apiUrl}/agendas/${agendaId}/eventos/${eventoId}`, { headers });
  }
}
