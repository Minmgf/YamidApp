import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserData } from './auth.guard';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const user: UserData = JSON.parse(userData);
      const requiredRoles = route.data['roles'] as string[];
      const requiredPermission = route.data['permission'] as string;
      const routeName = this.getRouteNameFromUrl(state.url);

      // Verificar acceso basado en rol
      if (this.hasRequiredRole(user, requiredRoles)) {
        return true;
      }

      // Verificar acceso basado en permisos específicos
      if (this.hasRequiredPermission(user, requiredPermission || routeName)) {
        return true;
      }

      // Si no tiene acceso, redirigir a una ruta permitida
      this.redirectToAllowedRoute(user);
      return false;

    } catch (error) {
      console.error('Error in RoleGuard:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene uno de los roles requeridos
   */
  private hasRequiredRole(user: UserData, requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Si no se especifican roles, permitir acceso
    }

    return requiredRoles.includes(user.rol);
  }

  /**
   * Verifica si el usuario tiene el permiso específico requerido
   */
  private hasRequiredPermission(user: UserData, permission: string): boolean {
    // Super admin tiene acceso a todo
    if (user.rol === 'super_admin') {
      return true;
    }

    // Verificar acceso completo
    if (user.permisos?.acceso_completo) {
      return true;
    }

    // Verificar permisos específicos según la ruta
    switch (permission) {
      case 'dashboard':
        return user.permisos?.dashboard || user.permisos?.puede_ver_metricas || false;
      case 'municipios':
        return user.permisos?.municipios || user.permisos?.puede_ver_metricas || false;
      case 'agenda':
        return user.permisos?.agenda || true; // Agenda disponible para todos
      case 'blog':
        return user.permisos?.blog || true; // Blog disponible para todos
      case 'perfil':
        return user.permisos?.perfil || true; // Perfil disponible para todos
      default:
        return false;
    }
  }

  /**
   * Extrae el nombre de la ruta desde la URL
   */
  private getRouteNameFromUrl(url: string): string {
    const segments = url.split('/');
    return segments[segments.length - 1] || 'dashboard';
  }

  /**
   * Redirige al usuario a una ruta que tenga permisos para acceder
   */
  private redirectToAllowedRoute(user: UserData): void {
    // Priorizar rutas por disponibilidad
    const routePriority = ['agenda', 'blog', 'perfil'];

    for (const route of routePriority) {
      if (this.hasRequiredPermission(user, route)) {
        this.router.navigate([`/tabs/${route}`]);
        return;
      }
    }

    // Si no tiene acceso a ninguna ruta, redirigir al login
    this.router.navigate(['/login']);
  }
}
