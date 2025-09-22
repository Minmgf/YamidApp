import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserData } from '../guards/auth.guard';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
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
            console.log('ID del usuario para created_by:', usuario.id);
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
        console.log('Usuario cargado desde localStorage:', user);
        console.log('ID del usuario cargado:', user.id);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.logout();
      }
    } else {
      console.log('No hay datos de usuario en localStorage');
    }
  }

  /**
   * Obtiene el usuario currentUser
   */
  getCurrentUser(): UserData | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('token');
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
      case 'usuarios':
        return (user as any).rol_id === 1 || user.permisos?.usuarios || false; // Solo super_admin (rol_id: 1)
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

    // Usar los roles del backend directamente
    const userAny = user as any;
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

    // También verificar por nombre del rol si está disponible
    if (userAny.rol) {
      switch (userAny.rol) {
        case 'super_admin':
        case 'admin':
        case 'coordinador':
          return '/tabs/dashboard';
        case 'lider':
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
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    // Verificar por rol
    return user.rol === 'super_admin' || user.rol === 'admin';
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    // Si existe el servicio de notificaciones, desregistrar el token
    try {
      // Importación dinámica para evitar dependencias circulares
      import('./notification.service').then(({ NotificationService }) => {
        // Verificar si hay una instancia del servicio disponible en el injector
        const notificationService = (this as any).injector?.get(NotificationService);
        if (notificationService) {
          notificationService.unregisterTokenFromBackend().catch((error: any) => {
            console.log('Could not unregister FCM token:', error);
          });
        }
      }).catch(() => {
        // No hacer nada si el servicio no está disponible
      });
    } catch (error) {
      console.log('Notification service not available during logout');
    }

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
