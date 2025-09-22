import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

interface NotificationData {
  tipo: 'evento_proximo' | 'nueva_incidencia' | 'manual';
  evento_id?: string;
  incidencia_id?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private fcmToken: string = '';
  private isInitialized: boolean = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private toast: HotToastService
  ) {}

  /**
   * Inicializa el servicio de notificaciones push
   * Debe llamarse al iniciar la app
   */
  async initializePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      // Solicitar permisos
      await this.requestPermissions();

      // Configurar listeners
      this.addListeners();

      // Registrar token
      await this.registerForPushNotifications();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }

  /**
   * Solicita permisos para notificaciones push
   */
  private async requestPermissions(): Promise<void> {
    const result = await PushNotifications.requestPermissions();

    if (result.receive === 'granted') {
      console.log('✅ Push notification permissions granted');
    } else {
      console.log('❌ Push notification permissions denied');
      throw new Error('Push notification permissions denied');
    }
  }

  /**
   * Configura los listeners para notificaciones
   */
  private addListeners(): void {
    // Listener para cuando se recibe el token FCM
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('📱 FCM Token received:', token.value);
      this.fcmToken = token.value;
      this.sendTokenToBackend(token.value);
    });

    // Listener para errores de registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Error on registration:', error);
    });

    // Listener para notificaciones recibidas (app abierta)
    PushNotifications.addListener('pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('📥 Push notification received:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listener para cuando el usuario toca la notificación
    PushNotifications.addListener('pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('🔔 Push notification action performed:', notification);
        this.handleNotificationAction(notification);
      }
    );
  }

  /**
   * Registra el dispositivo para recibir push notifications
   */
  private async registerForPushNotifications(): Promise<void> {
    await PushNotifications.register();
  }

  /**
   * Maneja notificaciones recibidas cuando la app está abierta
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    const { title, body, data } = notification;

    // Mostrar toast con la notificación
    this.toast.success(`${title}: ${body}`, {
      duration: 5000
    });

    // Procesar datos específicos si los hay
    if (data) {
      this.processNotificationData(data as NotificationData);
    }
  }

  /**
   * Maneja acciones cuando el usuario toca la notificación
   */
  private handleNotificationAction(actionPerformed: ActionPerformed): void {
    const { notification } = actionPerformed;
    const data = notification.data as NotificationData;

    console.log('🎯 Processing notification action:', data);

    if (data && data.tipo) {
      this.navigateBasedOnNotificationType(data);
    }
  }

  /**
   * Procesa los datos de la notificación según el tipo
   */
  private processNotificationData(data: NotificationData): void {
    switch (data.tipo) {
      case 'evento_proximo':
        console.log('📅 Próximo evento:', data);
        // Aquí puedes agregar lógica adicional como actualizar datos locales
        break;

      case 'nueva_incidencia':
        console.log('🚨 Nueva incidencia:', data);
        // Aquí puedes agregar lógica para actualizar el dashboard
        break;

      case 'manual':
        console.log('📢 Notificación manual:', data);
        break;

      default:
        console.log('📋 Notificación desconocida:', data);
    }
  }

  /**
   * Navega a la pantalla correspondiente según el tipo de notificación
   */
  private navigateBasedOnNotificationType(data: NotificationData): void {
    try {
      switch (data.tipo) {
        case 'evento_proximo':
          if (data.evento_id) {
            this.router.navigate(['/tabs/agenda'], {
              queryParams: { evento_id: data.evento_id }
            });
          } else {
            this.router.navigate(['/tabs/agenda']);
          }
          break;

        case 'nueva_incidencia':
          // Solo navegar si el usuario tiene permisos de admin
          if (this.isUserAdmin()) {
            if (data.incidencia_id) {
              this.router.navigate(['/tabs/dashboard'], {
                queryParams: { incidencia_id: data.incidencia_id }
              });
            } else {
              this.router.navigate(['/tabs/dashboard']);
            }
          }
          break;

        case 'manual':
          // Para notificaciones manuales, ir al dashboard general
          this.router.navigate(['/tabs/dashboard']);
          break;

        default:
          console.log('Tipo de notificación no reconocido:', data.tipo);
      }
    } catch (error) {
      console.error('Error navegando:', error);
    }
  }

  /**
   * Verifica si el usuario actual es super administrador
   */
  private isUserAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Solo super admin puede navegar a incidencias
    return currentUser.rol === 'super_admin';
  }

  /**
   * Envía el token FCM al backend para registro
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    if (!token) return;

    try {
      const headers = this.getAuthHeaders();

      const response = await this.http.post(
        `${environment.apiUrl}/auth/register-fcm-token`,
        { fcm_token: token },
        { headers }
      ).toPromise();

      console.log('✅ Token FCM registrado en backend:', response);
    } catch (error) {
      console.error('❌ Error registrando token FCM:', error);
    }
  }

  /**
   * Desregistra el token FCM del backend (al cerrar sesión)
   */
  async unregisterTokenFromBackend(): Promise<void> {
    try {
      const headers = this.getAuthHeaders();

      await this.http.delete(
        `${environment.apiUrl}/auth/unregister-fcm-token`,
        { headers }
      ).toPromise();

      console.log('✅ Token FCM desregistrado del backend');
    } catch (error) {
      console.error('❌ Error desregistrando token FCM:', error);
    }
  }

  /**
   * Obtiene headers de autenticación para las peticiones HTTP
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Métodos para envío manual de notificaciones (solo admins)
   */

  /**
   * Envía notificación manual a usuarios específicos
   */
  sendManualNotification(data: {
    usuarios_ids: number[];
    titulo: string;
    mensaje: string;
    datos_extra?: any;
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${environment.apiUrl}/notifications/manual`, data, { headers });
  }

  /**
   * Envía notificación a todo un municipio
   */
  sendMunicipalNotification(data: {
    municipio_id: number;
    titulo: string;
    mensaje: string;
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${environment.apiUrl}/notifications/municipio`, data, { headers });
  }

  /**
   * Obtiene el estado del sistema de notificaciones
   */
  getNotificationStatus(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/notifications/status`, { headers });
  }

  /**
   * Obtiene el token FCM actual
   */
  getCurrentFCMToken(): string {
    return this.fcmToken;
  }

  /**
   * Verifica si las notificaciones están inicializadas
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
