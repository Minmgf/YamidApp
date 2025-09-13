import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Incidencia {
  id?: number;
  titulo: string;
  categoria: 'infraestructura' | 'servicios_publicos' | 'seguridad' | 'medio_ambiente' | 'transporte' | 'otros';
  descripcion: string;
  ciudad_id?: number;
  ciudad_nombre?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  fecha_reporte?: string;
  estado?: 'pendiente' | 'publicada' | 'rechazada';
  autor?: string;
}

export interface Municipio {
  id: number;
  nombre: string;
  codigo_dane?: string;
}

export interface IncidenciasResponse {
  success: boolean;
  data: Incidencia[];
  total: number;
  page: number;
  limit: number;
  ciudad?: Municipio;
}

@Injectable({
  providedIn: 'root'
})
export class IncidenciasService {
  private apiUrl = `${environment.apiUrl}/incidencias`;
  private municipiosUrl = `${environment.apiUrl}/municipios`;

  constructor(private http: HttpClient) {
    console.log('🚀 IncidenciasService inicializado');
    console.log('🔗 API URL:', this.apiUrl);
    console.log('🏙️ Municipios URL:', this.municipiosUrl);
  }

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
   * Obtener todas las incidencias con paginación y filtros
   */
  getIncidencias(filtros?: {
    page?: number;
    limit?: number;
    categoria?: string;
    estado?: string;
    ciudad_id?: number;
    busqueda?: string;
  }): Observable<IncidenciasResponse> {
    let params = new HttpParams()
      .set('page', (filtros?.page || 1).toString())
      .set('limit', (filtros?.limit || 50).toString());

    if (filtros?.categoria) {
      params = params.set('categoria', filtros.categoria);
    }

    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros?.ciudad_id) {
      params = params.set('ciudad_id', filtros.ciudad_id.toString());
    }

    if (filtros?.busqueda) {
      params = params.set('busqueda', filtros.busqueda);
    }

    const finalUrl = `${this.apiUrl}?${params.toString()}`;
    console.log('🌐 URL completa de la petición:', finalUrl);
    console.log('📋 Parámetros construidos:', params.toString());

    return this.http.get<IncidenciasResponse>(this.apiUrl, { params });
  }

  /**
   * Crear una nueva incidencia
   */
  crearIncidencia(incidencia: Incidencia): Observable<{ message: string; incidencia: Incidencia }> {
    return this.http.post<{ message: string; incidencia: Incidencia }>(`${this.apiUrl}`, incidencia, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener una incidencia por ID
   */
  getIncidenciaPorId(id: number): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar una incidencia
   */
  actualizarIncidencia(id: number, incidencia: Partial<Incidencia>): Observable<{ message: string; incidencia: Incidencia }> {
    return this.http.put<{ message: string; incidencia: Incidencia }>(`${this.apiUrl}/${id}`, incidencia, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Aprobar una incidencia (solo admins)
   */
  aprobarIncidencia(id: number): Observable<{ message: string; incidencia: Incidencia }> {
    return this.http.put<{ message: string; incidencia: Incidencia }>(`${this.apiUrl}/${id}/aprobar`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Rechazar una incidencia (solo admins)
   */
  rechazarIncidencia(id: number): Observable<{ message: string; incidencia: Incidencia }> {
    return this.http.put<{ message: string; incidencia: Incidencia }>(`${this.apiUrl}/${id}/rechazar`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Eliminar una incidencia (solo admins)
   */
  eliminarIncidencia(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener incidencias por ciudad
   */
  getIncidenciasPorCiudad(ciudadId: number, page: number = 1, limit: number = 50, categoria?: string, estado?: string): Observable<IncidenciasResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (categoria) {
      params = params.set('categoria', categoria);
    }

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<IncidenciasResponse>(`${this.apiUrl}/ciudad/${ciudadId}`, { params });
  }

  /**
   * Obtener total de incidencias
   */
  getTotalIncidencias(): Observable<number | {total: number}> {
    return this.http.get<number | {total: number}>(`${this.apiUrl}/total`);
  }

  /**
   * Obtener lista de municipios
   */
  getMunicipios(): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(this.municipiosUrl);
  }

  /**
   * Obtener ciudades disponibles para incidencias
   */
  getCiudadesDisponibles(): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${this.apiUrl}/ciudades`);
  }

  /**
   * Actualizar estado de incidencia
   */
  actualizarEstadoIncidencia(id: number, estado: string): Observable<any> {
    console.log(`Actualizando estado de incidencia ${id} a ${estado}:`, this.apiUrl);
    let endpoint = '';
    if (estado === 'rechazada') {
      endpoint = `${this.apiUrl}/${id}/rechazar`;
    } else {
      endpoint = `${this.apiUrl}/${id}/aprobar`;
    }
    return this.http.put(endpoint, { estado }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => console.log('Respuesta de actualizar estado:', response)),
      catchError(error => {
        console.error('Error al actualizar estado de incidencia:', error);
        throw error;
      })
    );
  }
}
