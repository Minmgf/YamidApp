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
    console.log('🚀 Starting push notification initialization...');
    console.log('📱 Platform:', Capacitor.getPlatform());
    console.log('📱 Is native platform:', Capacitor.isNativePlatform());

    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Push notifications only work on native platforms');
      return;
    }

    if (this.isInitialized) {
      console.log('✅ Push notifications already initialized');
      return;
    }

    // Verificar si hay un usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('👤 No authenticated user found - delaying initialization');
      // No lanzar error, simplemente esperar a que el usuario se autentique
      return;
    }

    console.log('👤 Authenticated user found:', currentUser.id);

    try {
      console.log('🔐 Requesting push notification permissions...');
      // Solicitar permisos
      await this.requestPermissions();

      console.log('👂 Adding notification listeners...');
      // Configurar listeners
      this.addListeners();

      console.log('📝 Registering for push notifications...');
      // Registrar token
      await this.registerForPushNotifications();

      this.isInitialized = true;
      console.log('✅ Push notifications initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Solicita permisos para notificaciones push
   */
  private async requestPermissions(): Promise<void> {
    console.log('🔐 Checking current push notification permissions...');

    const result = await PushNotifications.requestPermissions();

    console.log('🔐 Permission result:', result);
    console.log('🔐 Receive permission:', result.receive);

    if (result.receive === 'granted') {
      console.log('✅ Push notification permissions granted');
    } else {
      console.log('❌ Push notification permissions denied');
      console.log('❌ Permission status:', result.receive);

      // En Android, a veces los permisos se conceden automáticamente
      if (Capacitor.getPlatform() === 'android' && result.receive !== 'denied') {
        console.log('📱 Android: Proceeding despite permission status');
        return;
      }

      throw new Error(`Push notification permissions ${result.receive}`);
    }
  }

  /**
   * Configura los listeners para notificaciones
   */
  private addListeners(): void {
    // Listener para cuando se recibe el token FCM
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('📱 FCM Token received from platform:', token.value);
      console.log('📱 Token length:', token.value.length);
      console.log('📱 Platform:', Capacitor.getPlatform());

      this.fcmToken = token.value;

      // Intentar registrar el token inmediatamente
      this.sendTokenToBackend(token.value);
    });

    // Listener para errores de registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ FCM Registration Error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      this.toast.error('Error configurando notificaciones push');
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
    if (!token) {
      console.error('❌ No FCM token provided for backend registration');
      return;
    }

    // Verificar que el usuario esté autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('❌ No authenticated user - cannot register FCM token');
      return;
    }

    console.log('🔄 Attempting to register FCM token with backend...');
    console.log('📱 FCM Token:', token);
    console.log('👤 Current User ID:', currentUser.id);

    try {
      const headers = this.getAuthHeaders();
      console.log('🔐 Auth headers prepared');

      // Incluir información del dispositivo
      const deviceInfo = {
        platform: Capacitor.getPlatform(),
        timestamp: new Date().toISOString(),
        app_version: '1.0.0' // Podrías obtener esto de package.json
      };

      const payload = {
        fcm_token: token,
        device_info: deviceInfo
      };
      console.log('📤 Sending payload:', payload);

      const response = await this.http.post(
        `${environment.apiUrl}/auth/register-fcm-token`,
        payload,
        { headers }
      ).toPromise();

      console.log('✅ Token FCM registrado en backend:', response);
      this.toast.success('Notificaciones configuradas correctamente', { duration: 3000 });
    } catch (error) {
      console.error('❌ Error registrando token FCM:', error);
      console.error('❌ Error details:', {
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        message: (error as any)?.message,
        error: (error as any)?.error
      });

      // Mostrar error al usuario solo si es un error de red o servidor
      if ((error as any)?.status >= 500) {
        this.toast.error('Error de servidor al configurar notificaciones');
      }
    }
  }

  /**
   * Desregistra el token FCM del backend (al cerrar sesión)
   */
  async unregisterTokenFromBackend(): Promise<void> {
    try {
      const headers = this.getAuthHeaders();

      // Incluir el token actual para desregistrar específicamente este dispositivo
      const payload = {
        fcm_token: this.fcmToken,
        device_info: {
          platform: Capacitor.getPlatform(),
          action: 'logout'
        }
      };

      await this.http.delete(
        `${environment.apiUrl}/auth/unregister-fcm-token`,
        {
          headers,
          body: payload
        }
      ).toPromise();

      console.log('✅ Token FCM desregistrado del backend para este dispositivo');
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
   * Obtiene información de todos los dispositivos registrados para el usuario actual
   */
  getUserDevices(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${environment.apiUrl}/auth/user-devices`, { headers });
  }

  /**
   * Desregistra un dispositivo específico por su token FCM
   */
  unregisterSpecificDevice(fcmToken: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${environment.apiUrl}/auth/unregister-device`, {
      headers,
      body: { fcm_token: fcmToken }
    });
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

  /**
   * Re-intenta la inicialización de notificaciones
   * Útil para llamar después del login
   */
  async retryInitialization(): Promise<void> {
    console.log('🔄 Retrying push notification initialization...');
    this.isInitialized = false;
    await this.initializePushNotifications();
  }

  /**
   * Fuerza el re-registro del token FCM actual
   */
  async forceTokenRefresh(): Promise<void> {
    if (this.fcmToken) {
      console.log('🔄 Forcing FCM token refresh...');
      await this.sendTokenToBackend(this.fcmToken);
    } else {
      console.log('❌ No FCM token available for refresh');
    }
  }

  /**
   * Método de diagnóstico para probar FCM manualmente
   */
  async diagnoseFCM(): Promise<{success: boolean, details: any}> {
    console.log('🔍 Starting FCM diagnostics...');

    const result = {
      success: false,
      details: {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        isInitialized: this.isInitialized,
        hasToken: !!this.fcmToken,
        currentToken: this.fcmToken,
        tokenLength: this.fcmToken?.length || 0,
        hasUser: !!this.authService.getCurrentUser(),
        userId: this.authService.getCurrentUser()?.id,
        permissions: null as any,
        userDevices: null as any,
        errors: [] as string[]
      }
    };

    try {
      // Verificar plataforma
      if (!Capacitor.isNativePlatform()) {
        result.details.errors.push('Not running on native platform');
        return result;
      }

      // Verificar usuario autenticado
      if (!this.authService.getCurrentUser()) {
        result.details.errors.push('No authenticated user');
        return result;
      }

      // Verificar permisos
      const permissions = await PushNotifications.requestPermissions();
      result.details.permissions = permissions;

      if (permissions.receive !== 'granted') {
        result.details.errors.push(`Permissions not granted: ${permissions.receive}`);
      }

      // Intentar obtener información de dispositivos del usuario
      try {
        const devices = await this.getUserDevices().toPromise();
        result.details.userDevices = devices;
        console.log('📱 User devices found:', devices);
      } catch (deviceError) {
        console.warn('⚠️ Could not fetch user devices:', deviceError);
      }

      // Intentar obtener token
      if (!this.fcmToken) {
        console.log('🔄 Attempting to register for notifications...');
        await PushNotifications.register();

        // Esperar un poco para que el token llegue
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (this.fcmToken) {
        // Intentar enviar token al backend
        await this.sendTokenToBackend(this.fcmToken);
        result.success = true;
        console.log('✅ FCM Token successfully registered as new device');
      } else {
        result.details.errors.push('Failed to obtain FCM token');
      }

    } catch (error) {
      console.error('❌ FCM Diagnosis failed:', error);
      result.details.errors.push(`Exception: ${error}`);
    }

    console.log('🔍 FCM Diagnosis result:', result);
    return result;
  }
}
