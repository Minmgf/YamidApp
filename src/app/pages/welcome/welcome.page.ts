import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { RegisterUserModalComponent } from '../../shared/modals/register-user-modal/register-user-modal.component';
import { EvaluateLeaderModalComponent } from '../../shared/modals/evaluate-leader-modal/evaluate-leader-modal.component';
import { UserRegistrationService } from '../../services/user-registration.service';
import { AuthService } from '../../services/auth.service';

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
  createdByName: string = 'Cargando...';

  // Precargar modales para evitar delays
  private registerModalPreloaded: HTMLIonModalElement | null = null;
  private evaluateModalPreloaded: HTMLIonModalElement | null = null;

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private userService: UserRegistrationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Usar el AuthService para obtener el usuario
    this.user = this.authService.getCurrentUser();
    if (this.user) {
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
}
