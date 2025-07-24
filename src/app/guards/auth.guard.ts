import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

export interface UserData {
  id?: string;
  nombre?: string;
  email?: string;
  cedula?: string;
  celular?: string;
  municipio?: string;
  lugar_votacion?: string;
  rol: 'super_admin' | 'admin' | 'user' | 'simpatizante';
  permisos?: {
    acceso_completo?: boolean;
    dashboard?: boolean;
    municipios?: boolean;
    usuarios?: boolean;
    agenda?: boolean;
    blog?: boolean;
    perfil?: boolean;
    puede_registrar_usuarios?: boolean;
    puede_ver_metricas?: boolean;
    puede_gestionar_roles?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    // Verificar si hay token de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificar si hay datos de usuario
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const user: UserData = JSON.parse(userData);

      // Si no hay rol, redirigir al login
      if (!user.rol) {
        this.router.navigate(['/login']);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
