import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  email: string;
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

  /**
   * Obtiene un usuario por su ID
   */
  getUserById(userId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/usuarios/${userId}`, { headers });
  }

  /**
   * Obtiene todos los usuarios (solo para super admins)
   */
  getAllUsers(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/usuarios`, { headers });
  }
}
