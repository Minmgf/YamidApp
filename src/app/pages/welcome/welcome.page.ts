import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { RegisterUserModalComponent } from '../../shared/modals/register-user-modal/register-user-modal.component';
import { EvaluateLeaderModalComponent } from '../../shared/modals/evaluate-leader-modal/evaluate-leader-modal.component';
import { UserIncidenciasModalComponent } from '../../shared/modals/user-incidencias-modal/user-incidencias-modal.component';
import { UserRegistrationService } from '../../services/user-registration.service';
import { AuthService } from '../../services/auth.service';
import { IncidenciasService } from '../../services/incidencias.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // <--- Importante para los componentes ion-*
    MainHeaderComponent
  ]
})
export class WelcomePage implements OnInit {
  user: any = null;
  registers: number = 0;
  createdByName: string = 'Cargando...';

  // Precargar modales para evitar delays
  private registerModalPreloaded: HTMLIonModalElement | null = null;
  private evaluateModalPreloaded: HTMLIonModalElement | null = null;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private userService: UserRegistrationService,
    private authService: AuthService,
    private incidenciasService: IncidenciasService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Usar el AuthService para obtener el usuario
    this.user = this.authService.getCurrentUser();
    console.log('👤 Usuario completo en Welcome:', this.user);
    console.log('📊 Registers del usuario:', this.user?.registers);
    console.log('⭐ Rating del usuario:', this.user?.rating);

    if (this.user) {
      // Cargar la información completa del usuario (incluyendo registers)
      this.loadUserRegisters();

      // Cargar el nombre del usuario que registró
      if (this.user.created_by) {
        this.loadCreatedByName();
      } else {
        // Si created_by es null, es un usuario creado por el sistema
        this.createdByName = 'Sistema';
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Carga la información completa del usuario desde el endpoint
   */
  private loadUserRegisters(): void {
    // Llamar al endpoint usuarios/{id} que retorna la información completa
    this.userService.getUserById(this.user.id).subscribe({
      next: (response: any) => {
        console.log('📊 Respuesta completa del usuario:', response);

        if (response && this.user) {
          // Actualizar solo las propiedades que nos interesan, manteniendo las existentes
          if (response.registers !== undefined) {
            this.user.registers = response.registers;
          }

          // Agregar la propiedad rating
          if (response.rating !== undefined) {
            this.user.rating = response.rating;
          }

          // También podemos actualizar otras propiedades que puedan haber cambiado
          if (response.nombre_completo) this.user.nombre_completo = response.nombre_completo;
          if (response.correo) this.user.correo = response.correo;
          if (response.celular) this.user.celular = response.celular;
          if (response.municipio) this.user.municipio = response.municipio;
          if (response.lugar_votacion !== undefined) this.user.lugar_votacion = response.lugar_votacion;

          // Actualizar en localStorage
          this.authService.updateUser(this.user);

        }
      },
      error: (err: any) => {
        console.error('Error al cargar información del usuario:', err);
        // Si hay error, establecer valores por defecto
        if (this.user) {
          this.user.registers = 0;
          this.user.rating = 0;
        }
      }
    });
  }

  /**
   * Carga el nombre del usuario que registró al usuario actual
   */
  private loadCreatedByName(): void {
    if (!this.user?.created_by) {
      this.createdByName = 'Sistema';
      return;
    }

    this.userService.getUserById(this.user.created_by).subscribe({
      next: (response) => {
        console.log('Respuesta del usuario que registró:', response);
        if (response && response.nombre_completo) {
          this.createdByName = response.nombre_completo;
        } else {
          this.createdByName = `Usuario ID: ${this.user.created_by}`;
        }
      },
      error: (err) => {
        console.error('Error al cargar el usuario que registró:', err);
        // Si hay error, mostrar un mensaje más amigable
        if (err.status === 404) {
          this.createdByName = 'Usuario no encontrado';
        } else if (err.status === 403) {
          this.createdByName = 'Sin permisos para consultar';
        } else {
          this.createdByName = `Usuario ID: ${this.user.created_by}`;
        }
      }
    });
  }

  getPermissionsList(): string[] {
    if (!this.user?.permisos) return [];

    // Ahora usar las etiquetas que coinciden con los permisos del backend
    const labels: { [key: string]: string } = {
      puede_registrar_usuarios: 'Registrar usuarios',
      puede_ver_metricas: 'Ver métricas',
      puede_gestionar_roles: 'Gestionar roles',
      acceso_completo: 'Acceso completo'
    };

    return Object.entries(this.user.permisos)
      .filter(([_, v]) => v)
      .map(([k, _]) => labels[k] || k);
  }

  /**
   * Formatea el nombre del rol para mostrar de manera amigable
   */
  formatRoleName(roleName: string): string {
    if (!roleName) return 'Sin rol';

    switch (roleName) {
      case 'super_admin': return 'Super Admin';
      case 'lider_principal': return 'Líder Principal';
      case 'simpatizante': return 'Simpatizante';
      case 'aliado': return 'Aliado';
      case 'admin': return 'Administrador';
      case 'lider': return 'Líder';
      case 'votante': return 'Votante';
      default: return roleName;
    }
  }

  /**
   * Obtiene el nombre del usuario que registró al usuario actual
   */
  getCreatedByName(): string {
    return this.createdByName;
  }

  logout() {
    this.authService.logout();
    this.user = null;
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Abre el modal para registrar un nuevo usuario
   */
  async openRegisterModal() {
    // Verificar permisos antes de abrir el modal usando los permisos del backend
    if (!this.user?.permisos?.puede_registrar_usuarios) {
      await this.showAlert('Sin permisos', 'No tienes permisos para registrar usuarios');
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: RegisterUserModalComponent,
        cssClass: 'register-user-modal',
        backdropDismiss: false,
        showBackdrop: true,
        animated: true,
        keyboardClose: true
      });

      // Presentar inmediatamente sin esperar
      modal.present();

      // Manejar el cierre de forma asíncrona
      modal.onDidDismiss().then((result) => {
        if (result.data?.success) {
          this.showAlert('Éxito', 'Usuario registrado correctamente');
        }
      });
    } catch (error) {
      console.error('Error al abrir modal de registro:', error);
    }
  }

  /**
   * Abre el modal para evaluar al líder
   */
  async openEvaluateModal() {
    // Verificar que el usuario haya sido registrado por otro usuario (no por el sistema)
    if (!this.user?.created_by || this.createdByName === 'Sistema') {
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: EvaluateLeaderModalComponent,
        cssClass: 'evaluate-leader-modal',
        backdropDismiss: false,
        showBackdrop: true,
        animated: true,
        keyboardClose: true,
        componentProps: {
          leaderName: this.createdByName,
          evaluadoId: this.user.created_by,
          evaluatorId: this.user.id,
          evaluatorName: this.user.nombre_completo
        }
      });

      // Presentar inmediatamente sin esperar
      modal.present();

      // Manejar el cierre de forma asíncrona
      modal.onDidDismiss().then((result) => {
        if (result.data?.success) {
          this.showAlert('Calificación enviada', `Has calificado a ${this.createdByName} con ${result.data.rating} estrella${result.data.rating !== 1 ? 's' : ''}`);
        }
      });
    } catch (error) {
      console.error('Error al abrir modal de evaluación:', error);
    }
  }

  /**
   * Abre el modal para ver las incidencias del usuario
   */
  async openIncidenciasModal() {
    if (!this.user?.id) {
      await this.showAlert('Error', 'No se pudo obtener la información del usuario');
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: UserIncidenciasModalComponent,
        cssClass: 'user-incidencias-modal',
        backdropDismiss: true,
        showBackdrop: true,
        animated: true,
        presentingElement: document.querySelector('ion-router-outlet') || undefined,
        canDismiss: true,
        componentProps: {
          userId: this.user.id,
          userName: this.user.nombre_completo || `${this.user.nombre} ${this.user.apellido}`
        }
      });

      await modal.present();

      // Opcional: manejar el cierre si necesitas hacer algo después
      modal.onDidDismiss().then((result) => {
        // Aquí puedes agregar lógica después de cerrar el modal si es necesario
      });
    } catch (error) {
      console.error('Error al abrir modal de incidencias:', error);
      await this.showAlert('Error', 'No se pudo abrir el modal de incidencias');
    }
  }

  /**
   * Muestra una alerta
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // =================== MÉTODOS PARA CARDS DE ESTADÍSTICAS ===================

  /**
   * Obtiene el total de votantes registrados
   * TODO: Conectar con endpoint real
   */
  getTotalVotantes(): number {
    // Simulación - reemplazar con llamada al API
    return 15420;
  }

  /**
   * Obtiene el porcentaje de crecimiento de votantes
   * TODO: Conectar con endpoint real
   */
  getVotantesGrowth(): number {
    // Simulación - reemplazar con llamada al API
    return 12.5;
  }

  /**
   * Obtiene el porcentaje de votantes activos
   * TODO: Conectar con endpoint real
   */
  getActiveVotantesPercentage(): number {
    // Simulación - reemplazar con llamada al API
    return 78;
  }

  /**
   * Obtiene el número de nuevos votantes registrados hoy
   * TODO: Conectar con endpoint real
   */
  getNewVotantesToday(): number {
    // Simulación - reemplazar con llamada al API
    return 23;
  }

  /**
   * Obtiene el número de votantes verificados
   * TODO: Conectar con endpoint real
   */
  getVerifiedVotantes(): number {
    // Simulación - reemplazar con llamada al API
    return 14891;
  }

  /**
   * Obtiene la calificación promedio del servicio
   * TODO: Conectar con endpoint real
   */
  getAverageRating(): number {
    // Simulación - reemplazar con llamada al API
    return 4.3;
  }

  /**
   * Obtiene el número de estrellas a mostrar
   */
  getStarCount(): number {
    // Usar el rating real del usuario si está disponible
    if (this.user?.rating !== undefined) {
      return Math.round(this.user.rating);
    }
    // Fallback al método anterior si no hay rating
    return Math.round(this.getAverageRating());
  }

  /**
   * Obtiene el porcentaje de calificaciones excelentes
   * TODO: Conectar con endpoint real
   */
  getExcellentRating(): number {
    // Simulación - reemplazar con llamada al API
    return 65;
  }

  /**
   * Obtiene el porcentaje de calificaciones buenas
   * TODO: Conectar con endpoint real
   */
  getGoodRating(): number {
    // Simulación - reemplazar con llamada al API
    return 28;
  }

  /**
   * Obtiene el porcentaje de calificaciones regulares
   * TODO: Conectar con endpoint real
   */
  getRegularRating(): number {
    // Simulación - reemplazar con llamada al API
    return 7;
  }

  /**
   * Obtiene el total de reseñas
   * TODO: Conectar con endpoint real
   */
  getTotalReviews(): number {
    // Simulación - reemplazar con llamada al API
    return 1247;
  }

  /**
   * Obtiene el tiempo de la última actualización
   * TODO: Conectar con endpoint real
   */
  getLastUpdateTime(): string {
    // Simulación - reemplazar con llamada al API
    return '5 min';
  }

  /**
   * Verifica si el usuario tiene alguna acción disponible
   */
  hasAnyActions(): boolean {
    const hasRegisterPermission = this.user?.permisos?.puede_registrar_usuarios;
    const hasEvaluateOption = this.user?.created_by && this.createdByName !== 'Sistema';
    const hasIncidenciasOption = this.user?.id; // Siempre disponible si tiene ID de usuario

    return hasRegisterPermission || hasEvaluateOption || hasIncidenciasOption;
  }

  /**
   * Verifica si estamos en entorno de producción
   */
  isProduction(): boolean {
    return environment.production;
  }

  // =================== MÉTODOS DE DEBUG ===================

  /**
   * Test completo para diagnosticar FCM
   */
  async testFCM(): Promise<void> {
    console.log('🔧 === DIAGNÓSTICO COMPLETO FCM ===');

    const alert = await this.alertCtrl.create({
      header: '🔧 Test FCM Iniciado',
      message: 'Revisa la consola para los logs detallados...',
      buttons: ['OK']
    });
    await alert.present();

    // 1. Verificar estado del usuario
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', currentUser);

    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    // 2. Verificar servicio de notificaciones
    console.log('🔔 Verificando NotificationService...');
    console.log('🔔 Service ready:', this.notificationService.isReady());

    // 3. Ejecutar diagnóstico del servicio
    console.log('🔍 Ejecutando diagnóstico del servicio...');
    await this.notificationService.diagnoseFCM();

    // 4. Forzar inicialización si no está lista
    if (!this.notificationService.isReady()) {
      console.log('🔄 Forzando inicialización...');
      try {
        await this.notificationService.initializePushNotifications();
        console.log('✅ Inicialización forzada exitosa');
      } catch (error) {
        console.error('❌ Error en inicialización forzada:', error);
      }
    }

    // 5. Intentar refrescar token
    console.log('🔄 Forzando refresh del token...');
    try {
      await this.notificationService.forceTokenRefresh();
      console.log('✅ Refresh del token completado');
    } catch (error) {
      console.error('❌ Error en refresh del token:', error);
    }

    console.log('🔧 === FIN DIAGNÓSTICO FCM ===');

    // Mostrar resultado final
    const finalAlert = await this.alertCtrl.create({
      header: '🔧 Diagnóstico Completado',
      message: 'Revisa la consola para todos los logs. Si no hay errores pero sigue sin funcionar, puede ser un problema del backend.',
      buttons: ['OK']
    });
    await finalAlert.present();
  }

  /**
   * Obtiene el tipo de la propiedad registers para debug
   */
  getRegisterType(): string {
    return typeof this.user?.registers;
  }

  /**
   * Obtiene las claves del objeto user para debug
   */
  getUserKeys(): string {
    return this.user ? Object.keys(this.user).join(', ') : 'no user';
  }
}
