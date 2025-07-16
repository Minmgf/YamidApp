import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Municipio {
  id: number;
  nombre: string;
  departamento?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface UsuarioRegistro {
  nombre: string;
  cedula: string;
  celular: string;
  password: string;
  municipio_id: number;
  lugar_votacion: string;
  rol_id: number;
  created_by: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserRegistrationService {
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
   * Obtiene la lista de municipios disponibles
   */
  getMunicipios(): Observable<Municipio[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Municipio[]>(`${this.apiUrl}/municipios`, { headers });
  }

  /**
   * Obtiene la lista de roles disponibles
   */
  getRoles(): Observable<Rol[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`, { headers });
  }

  /**
   * Registra un nuevo usuario
   */
  registerUser(userData: UsuarioRegistro): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/usuarios`, userData, { headers });
  }
}
