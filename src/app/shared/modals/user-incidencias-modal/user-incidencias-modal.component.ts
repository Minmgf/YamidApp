import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, LoadingController } from '@ionic/angular';
import { IncidenciasService, Incidencia } from '../../../services/incidencias.service';

@Component({
  selector: 'app-user-incidencias-modal',
  templateUrl: './user-incidencias-modal.component.html',
  styleUrls: ['./user-incidencias-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class UserIncidenciasModalComponent implements OnInit {
  @Input() userId: number = 0;
  @Input() userName: string = '';

  incidencias: Incidencia[] = [];
  isLoading: boolean = true;
  error: string = '';

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private incidenciasService: IncidenciasService
  ) { }

  ngOnInit() {
    this.loadIncidencias();
  }

  async loadIncidencias() {
    this.isLoading = true;
    this.error = '';

    try {
      const response = await this.incidenciasService.getIncidenciasPorUsuario(this.userId).toPromise();

      if (response && response.success && response.data) {
        this.incidencias = response.data;
      } else {
        this.incidencias = [];
      }
    } catch (error: any) {
      console.error('Error al cargar incidencias del usuario:', error);
      this.error = 'Error al cargar las incidencias';
      this.incidencias = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cierra el modal
   */
  dismiss() {
    this.modalCtrl.dismiss();
  }

  /**
   * Obtiene la clase CSS para el estado de la incidencia
   */
  getEstadoClass(estado: string | undefined): string {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'publicada': return 'estado-publicada';
      case 'rechazada': return 'estado-rechazada';
      default: return 'estado-pendiente';
    }
  }

  /**
   * Obtiene el texto amigable para el estado
   */
  getEstadoText(estado: string | undefined): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'publicada': return 'Publicada';
      case 'rechazada': return 'Rechazada';
      default: return 'Pendiente';
    }
  }

  /**
   * Obtiene el ícono para la categoría
   */
  getCategoriaIcon(categoria: string): string {
    switch (categoria) {
      case 'salud': return 'medical';
      case 'social': return 'people';
      case 'ambiental': return 'leaf';
      case 'infraestructura': return 'construct';
      case 'servicios_publicos': return 'water';
      case 'seguridad': return 'shield-checkmark';
      case 'transporte': return 'car';
      case 'otros': return 'ellipsis-horizontal';
      default: return 'information-circle';
    }
  }

  /**
   * Obtiene el texto amigable para la categoría
   */
  getCategoriaText(categoria: string): string {
    switch (categoria) {
      case 'salud': return 'Salud';
      case 'social': return 'Social';
      case 'ambiental': return 'Ambiental';
      case 'infraestructura': return 'Infraestructura';
      case 'servicios_publicos': return 'Servicios Públicos';
      case 'seguridad': return 'Seguridad';
      case 'transporte': return 'Transporte';
      case 'otros': return 'Otros';
      default: return 'Sin categoría';
    }
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Sin fecha';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }  /**
   * Cuenta incidencias por estado
   */
  getCountByEstado(estado: string): number {
    return this.incidencias.filter(inc => inc.estado === estado).length;
  }
}
