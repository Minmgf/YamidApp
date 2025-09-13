import { Component, OnInit, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incidencia } from '../../../services/incidencias.service';

@Component({
  selector: 'app-detalle-incidencia-modal',
  templateUrl: './detalle-incidencia-modal.component.html',
  styleUrls: ['./detalle-incidencia-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DetalleIncidenciaModalComponent implements OnInit {
  @Input() incidencia!: Incidencia;
  @Input() municipios: any[] = [];
  @Input() esAdmin: boolean = false;

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    console.log('🔍 Modal de detalle inicializado con incidencia:', this.incidencia);
    console.log('🏛️ Municipios disponibles:', this.municipios.length);
    console.log('👑 Es admin:', this.esAdmin);
  }

  /**
   * Cerrar modal
   */
  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  /**
   * Obtener color para categoría
   */
  getCategoriaColor(categoria: string): string {
    const colores: { [key: string]: string } = {
      'infraestructura': 'primary',
      'servicios_publicos': 'secondary',
      'seguridad': 'danger',
      'medio_ambiente': 'success',
      'transporte': 'warning',
      'salud': 'tertiary',
      'ambiental': 'success',
      'otros': 'medium'
    };
    return colores[categoria] || 'medium';
  }

  /**
   * Obtener label para categoría
   */
  getCategoriaLabel(categoria: string): string {
    const labels: { [key: string]: string } = {
      'infraestructura': 'Infraestructura',
      'servicios_publicos': 'Servicios Públicos',
      'seguridad': 'Seguridad',
      'medio_ambiente': 'Medio Ambiente',
      'transporte': 'Transporte',
      'salud': 'Salud',
      'ambiental': 'Ambiental',
      'otros': 'Otros'
    };
    return labels[categoria] || 'Otros';
  }

  /**
   * Obtener nombre del municipio
   */
  getMunicipioNombre(id?: number, nombreCiudad?: string): string {
    // Si ya viene el nombre de la ciudad en la respuesta, usarlo
    if (nombreCiudad) {
      return nombreCiudad;
    }

    // Si no, buscar en la lista de municipios
    if (id) {
      const municipio = this.municipios.find(m => m.id === id);
      return municipio?.nombre || 'Desconocido';
    }

    return 'Desconocido';
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha?: string | Date): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener iniciales del nombre del usuario
   */
  getInitials(nombre?: string): string {
    if (!nombre) return 'U';

    const words = nombre.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  /**
   * Acciones del modal (aprobar, rechazar, editar)
   */
  accionAprobar() {
    this.modalCtrl.dismiss({
      action: 'aprobar',
      incidencia: this.incidencia
    });
  }

  accionRechazar() {
    this.modalCtrl.dismiss({
      action: 'rechazar',
      incidencia: this.incidencia
    });
  }

  accionEditar() {
    this.modalCtrl.dismiss({
      action: 'editar',
      incidencia: this.incidencia
    });
  }
}
