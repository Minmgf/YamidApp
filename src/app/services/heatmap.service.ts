import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HeatmapData {
  municipio_id: number;
  municipio: string;
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  porcentaje_activos: number;
  densidad_usuarios: number;
}

export interface HeatmapResponse {
  success: boolean;
  data: HeatmapData[];
  total_municipios: number;
  total_usuarios_sistema: number;
  fecha_actualizacion: string;
}

export interface HeatmapFilters {
  estado?: 'activo' | 'inactivo' | 'todos';
  rol_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HeatmapService {
  private apiUrl = 'http://localhost:3000/api/heatmap';

  constructor(private http: HttpClient) { }

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
   * Obtiene datos de usuarios para mapa de calor
   */
  getHeatmapData(filters?: HeatmapFilters): Observable<HeatmapResponse> {
    const headers = this.getAuthHeaders();
    let params: any = {};

    if (filters) {
      if (filters.estado) params.estado = filters.estado;
      if (filters.rol_id) params.rol_id = filters.rol_id.toString();
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
    }

    return this.http.get<HeatmapResponse>(`${this.apiUrl}/usuarios`, {
      headers,
      params
    });
  }

  /**
   * Obtiene datos en formato GeoJSON
   */
  getHeatmapGeoJSON(filters?: HeatmapFilters): Observable<any> {
    const headers = this.getAuthHeaders();
    let params: any = {};

    if (filters) {
      if (filters.estado) params.estado = filters.estado;
      if (filters.rol_id) params.rol_id = filters.rol_id.toString();
    }

    return this.http.get<any>(`${this.apiUrl}/usuarios/geojson`, {
      headers,
      params
    });
  }
}
