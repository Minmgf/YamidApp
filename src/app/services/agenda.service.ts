import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AgendaEvento {
  id?: number;
  id_agenda?: number; // Actualizado para coincidir con backend
  nombre_evento: string;
  fecha: string; // Fecha específica del evento (YYYY-MM-DD)
  municipio_id: number;
  municipio_nombre?: string; // Nombre del municipio (viene del JOIN)
  hora?: string;
  lugar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgendaMensual {
  id?: number;
  titulo: string;
  mes: number; // 1-12
  anio: number;
  descripcion?: string;
  nota_asesor?: string;
  created_at?: string;
  updated_at?: string;
  eventos?: AgendaEvento[];
}

export interface AgendaResponse {
  success: boolean;
  message?: string;
  total?: number;
  agendas?: AgendaMensual[];
  agenda?: AgendaMensual;
}

export interface EventoResponse {
  success: boolean;
  message?: string;
  evento?: AgendaEvento;
  eventos?: AgendaEvento[];
  total_eventos?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  private apiUrl = environment.apiUrl;

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
   * Obtiene todas las agendas mensuales
   */
  getAllAgendas(anio?: number, mes?: number): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/agendas`;

    const params = new URLSearchParams();
    if (anio) params.append('anio', anio.toString());
    if (mes) params.append('mes', mes.toString());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<AgendaResponse>(url, { headers });
  }

  /**
   * Obtiene una agenda específica con sus eventos
   */
  getAgendaById(agendaId: number): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<AgendaResponse>(`${this.apiUrl}/agendas/${agendaId}`, { headers });
  }

  /**
   * Crea una nueva agenda mensual
   */
  crearAgendaMensual(agenda: Omit<AgendaMensual, 'id' | 'created_at' | 'updated_at'>): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<AgendaResponse>(`${this.apiUrl}/agendas`, agenda, { headers });
  }

  /**
   * Actualiza una agenda mensual
   */
  actualizarAgenda(agendaId: number, agenda: Partial<AgendaMensual>): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<AgendaResponse>(`${this.apiUrl}/agendas/${agendaId}`, agenda, { headers });
  }

  /**
   * Elimina una agenda mensual y todos sus eventos
   */
  eliminarAgenda(agendaId: number): Observable<AgendaResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<AgendaResponse>(`${this.apiUrl}/agendas/${agendaId}`, { headers });
  }

  /**
   * Obtiene eventos de una agenda específica
   */
  getEventosByAgenda(agendaId: number, municipioId?: number, fechaInicio?: string, fechaFin?: string): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    let url = `${this.apiUrl}/agendas/${agendaId}/eventos`;

    const params = new URLSearchParams();
    if (municipioId) params.append('municipio_id', municipioId.toString());
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<EventoResponse>(url, { headers });
  }

  /**
   * Crea un nuevo evento en una agenda
   */
  agregarEvento(agendaId: number, evento: Omit<AgendaEvento, 'id' | 'id_agenda' | 'created_at' | 'updated_at'>): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<EventoResponse>(`${this.apiUrl}/agendas/${agendaId}/eventos`, evento, { headers });
  }

  /**
   * Obtiene un evento específico
   */
  getEventoById(eventoId: number): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<EventoResponse>(`${this.apiUrl}/agendas/eventos/${eventoId}`, { headers });
  }

  /**
   * Actualiza un evento específico
   */
  actualizarEvento(eventoId: number, evento: Partial<AgendaEvento>): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<EventoResponse>(`${this.apiUrl}/agendas/eventos/${eventoId}`, evento, { headers });
  }

  /**
   * Elimina un evento específico
   */
  eliminarEvento(eventoId: number): Observable<EventoResponse> {
    const headers = this.getAuthHeaders();
    return this.http.delete<EventoResponse>(`${this.apiUrl}/agendas/eventos/${eventoId}`, { headers });
  }

  // ============= MÉTODOS DE COMPATIBILIDAD (DEPRECADOS) =============

  /**
   * @deprecated Usar getAllAgendas() en su lugar
   */
  getAgendasByMunicipio(municipioId: number): Observable<AgendaResponse> {
    return this.getAllAgendas();
  }

  /**
   * @deprecated Usar crearAgendaMensual() en su lugar
   */
  crearAgenda(agenda: any): Observable<AgendaResponse> {
    const agendaMensual: Omit<AgendaMensual, 'id' | 'created_at' | 'updated_at'> = {
      titulo: `Agenda ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      descripcion: agenda.nota_asesor || ''
    };
    return this.crearAgendaMensual(agendaMensual);
  }
}
