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

    try {
      await this.notificationService.initializePushNotifications();
      console.log('🔔 Push notifications initialized in app.component');
    } catch (error) {
      console.error('❌ Error initializing push notifications in app.component:', error);
    }
  }

  async ngOnInit() {
    await this.platform.ready();

    if (this.platform.is('capacitor')) {
      try {
        // Configurar la barra de estado
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: false });

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
