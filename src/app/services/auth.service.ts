import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserData } from '../guards/auth.guard';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<UserData | null>(null);
  public currentUser$: Observable<UserData | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar con datos del localStorage si existen
    this.loadUserFromStorage();
  }

  /**
   * Login del usuario
   */
  login(identifier: string, password: string) {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { identifier, password })
      .pipe(
        tap((res) => {
          console.log('Respuesta completa del login:', res);

          // Ahora el backend devuelve data.user y data.token
          const usuario = res.user;

          if (usuario) {
            // Por ahora guardamos el usuario tal como viene del backend
            localStorage.setItem('currentUser', JSON.stringify(usuario));
            this.currentUserSubject.next(usuario);
            console.log('Usuario guardado:', usuario);
          } else {
            console.warn('No se encontró usuario en la respuesta');
          }

          // Ahora el token sí viene del backend
          if (res.token) {
            localStorage.setItem('token', res.token);
            console.log('Token guardado:', res.token);
          } else {
            console.warn('No se encontró token en la respuesta');
          }
        })
      );
  }

  /**
   * Carga los datos del usuario desde localStorage
   */
  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user: UserData = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.logout();
      }
    }
  }

  /**
   * Obtiene el usuario currentUser
   */
  getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  /**
   * Verifica si el usuario tiene acceso a una funcionalidad
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super admin tiene acceso a todo
    if (user.rol === 'super_admin') {
      return true;
    }

    // Verificar acceso completo
    if (user.permisos?.acceso_completo) {
      return true;
    }

    // Verificar permisos específicos según el nombre del backend
    switch (permission) {
      case 'dashboard':
        return user.permisos?.dashboard || user.permisos?.puede_ver_metricas || false;
      case 'municipios':
        return user.permisos?.municipios || user.permisos?.puede_ver_metricas || false;
      case 'agenda':
        return user.permisos?.agenda || true; // Agenda disponible para todos por defecto
      case 'blog':
        return user.permisos?.blog || true; // Blog disponible para todos por defecto
      case 'perfil':
        return user.permisos?.perfil || true; // Perfil disponible para todos por defecto
      default:
        return false;
    }
  }

  /**
   * Obtiene la primera ruta disponible para el usuario
   */
  getDefaultRoute(): string {
    const user = this.getCurrentUser();
    if (!user) return '/login';

    // Simplificar la lógica basada en rol_id del backend
    const userAny = user as any; // Cast temporal para acceder a rol_id
    if (userAny.rol_id) {
      switch (userAny.rol_id) {
        case 1: // super_admin
        case 2: // admin
        case 3: // coordinador
          return '/tabs/dashboard';
        case 4: // lider
          return '/tabs/agenda';
        default:
          return '/tabs/welcome';
      }
    }

    // Fallback por defecto
    return '/tabs/welcome';
  }

  /**
   * Actualiza los datos del usuario
   */
  updateUser(userData: UserData): void {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Lista de rutas disponibles para el usuario actual
   */
  getAvailableRoutes(): Array<{path: string, label: string, icon: string}> {
    const routes = [];

    if (this.hasPermission('dashboard')) {
      routes.push({ path: '/tabs/dashboard', label: 'Dashboard', icon: 'home-outline' });
    }
    if (this.hasPermission('municipios')) {
      routes.push({ path: '/tabs/municipios', label: 'Municipios', icon: 'map-outline' });
    }
    if (this.hasPermission('agenda')) {
      routes.push({ path: '/tabs/agenda', label: 'Agenda', icon: 'calendar-outline' });
    }
    if (this.hasPermission('blog')) {
      routes.push({ path: '/tabs/blog', label: 'Blog', icon: 'newspaper-outline' });
    }
    if (this.hasPermission('perfil')) {
      routes.push({ path: '/tabs/welcome', label: 'Perfil', icon: 'person-outline' });
    }

    return routes;
  }
}
