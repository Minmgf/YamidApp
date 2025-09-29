import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  /**
   * Inicializa las notificaciones push después de que el usuario se autentique
   */
  private async initializePushNotifications(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('🌐 Running on web - push notifications disabled');
      return;
    }

    // Solo inicializar si el usuario está autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('👤 No authenticated user - push notifications will initialize after login');
      return;
    }

    console.log('👤 Authenticated user found - initializing push notifications');

    try {
      // Si ya están inicializadas, re-intentar para asegurar que el token se envíe
      if (this.notificationService.isReady()) {
        console.log('🔄 Notifications already initialized, forcing token refresh...');
        await this.notificationService.forceTokenRefresh();
      } else {
        console.log('🚀 Initializing push notifications...');
        await this.notificationService.initializePushNotifications();
      }

      console.log('🔔 Push notifications initialized in app.component');
    } catch (error) {
      console.error('❌ Error initializing push notifications in app.component:', error);

      // Re-intentar después de 3 segundos
      setTimeout(async () => {
        console.log('🔄 Retrying push notification initialization...');
        try {
          await this.notificationService.retryInitialization();
          console.log('✅ Push notifications retry successful');
        } catch (retryError) {
          console.error('❌ Push notifications retry failed:', retryError);
        }
      }, 3000);
    }
  }

  async ngOnInit() {
    await this.platform.ready();

    if (this.platform.is('capacitor')) {
      try {
        // Configurar la barra de estado según la plataforma
        if (this.platform.is('ios')) {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        } else if (this.platform.is('android')) {
          await StatusBar.setStyle({ style: Style.Dark }); // Texto oscuro en fondo claro
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
          await StatusBar.setOverlaysWebView({ overlay: false });

          // En Android, asegurar que no se superponga
          console.log('📱 Android detected - status bar configured');
        }

        console.log('✅ StatusBar configurado correctamente');
      } catch (error) {
        console.error('❌ Error al configurar StatusBar:', error);
      }
    }

    // Suscribirse a cambios de autenticación para inicializar notificaciones
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Usuario autenticado - inicializar notificaciones push
        this.initializePushNotifications();
      } else {
        // Usuario no autenticado - limpiar notificaciones si es necesario
        console.log('👤 User logged out - push notifications will be cleaned up');
      }
    });
  }
}
