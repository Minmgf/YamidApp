import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>📊 Estado del Sistema</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="dismiss()">
            <ion-icon name="close" color="light"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="status-modal-content">
      <div class="status-container">

        <!-- Sección Firebase -->
        <div class="status-section firebase-section">
          <div class="section-header">
            <ion-icon name="flame" color="danger"></ion-icon>
            <h3>Firebase & Sistema</h3>
          </div>
          <div class="status-items">
            <div class="status-item">
              <span class="label">Firebase:</span>
              <span class="value" [ngClass]="sistema.firebase_configurado ? 'success' : 'error'">
                {{ sistema.firebase_configurado ? 'Configurado' : 'No configurado' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">Modo:</span>
              <span class="value mode-badge">{{ sistema.modo || 'desconocido' }}</span>
            </div>
          </div>
        </div>

        <!-- Sección Usuarios -->
        <div class="status-section users-section">
          <div class="section-header">
            <ion-icon name="people" color="primary"></ion-icon>
            <h3>Estadísticas de Usuarios</h3>
          </div>
          <div class="status-grid">
            <div class="stat-card">
              <div class="stat-number">{{ estadisticas.total_usuarios || 0 }}</div>
              <div class="stat-label">Total usuarios</div>
            </div>
            <div class="stat-card highlight">
              <div class="stat-number">{{ estadisticas.usuarios_con_token || 0 }}</div>
              <div class="stat-label">Con FCM</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ estadisticas.municipios_activos || 0 }}</div>
              <div class="stat-label">Municipios activos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ estadisticas.eventos_proximos || 0 }}</div>
              <div class="stat-label">Eventos próximos</div>
            </div>
          </div>
        </div>

        <!-- Sección Scheduler -->
        <div class="status-section scheduler-section">
          <div class="section-header">
            <ion-icon name="time" color="warning"></ion-icon>
            <h3>Scheduler de Notificaciones</h3>
          </div>
          <div class="status-items">
            <div class="status-item">
              <span class="label">Scheduler activo:</span>
              <span class="value" [ngClass]="sistema.scheduler_activo ? 'success' : 'error'">
                {{ sistema.scheduler_activo ? '✅ Activo' : '❌ Inactivo' }}
              </span>
            </div>
            <div class="status-item">
              <span class="label">Jobs registrados:</span>
              <span class="value number-badge">{{ scheduler.jobs_activos || 0 }}</span>
            </div>
            <div class="status-item">
              <span class="label">Jobs ejecutándose:</span>
              <span class="value number-badge" [ngClass]="(scheduler.jobs_corriendo || 0) > 0 ? 'running' : ''">
                {{ scheduler.jobs_corriendo || 0 }}
              </span>
            </div>
          </div>
        </div>

      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="footer-buttons">
          <ion-button fill="outline" size="default" (click)="refresh()">
            <ion-icon name="refresh" slot="start"></ion-icon>
            Actualizar
          </ion-button>
          <ion-button fill="solid" size="default" (click)="dismiss()">
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Cerrar
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styleUrls: ['./status-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class StatusModalComponent {
  @Input() sistema: any = {};
  @Input() estadisticas: any = {};
  @Input() scheduler: any = {};
  @Input() onRefresh: () => void = () => {};

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  refresh() {
    this.onRefresh();
    this.dismiss();
  }
}
