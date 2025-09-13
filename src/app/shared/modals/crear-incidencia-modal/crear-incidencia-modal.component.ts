import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NuevaIncidencia {
  titulo: string;
  categoria: string;
  descripcion: string;
  ciudad_id?: number;
}

@Component({
  selector: 'app-crear-incidencia-modal',
  templateUrl: './crear-incidencia-modal.component.html',
  styleUrls: ['./crear-incidencia-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CrearIncidenciaModalComponent implements OnInit {
  @Input() municipios: any[] = [];
  @Input() usuarioNombre: string = '';

  nuevaIncidencia: NuevaIncidencia = {
    titulo: '',
    categoria: 'otros',
    descripcion: '',
    ciudad_id: undefined
  };

  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    console.log('🆕 Modal de crear incidencia inicializado');
    console.log('🏛️ Municipios disponibles:', this.municipios?.length || 0);
    console.log('👤 Usuario:', this.usuarioNombre);
  }

  /**
   * Cerrar modal
   */
  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  /**
   * Validar formulario
   */
  validarFormulario(): boolean {
    return !!(
      this.nuevaIncidencia.titulo &&
      this.nuevaIncidencia.categoria &&
      this.nuevaIncidencia.descripcion &&
      this.nuevaIncidencia.ciudad_id
    );
  }

  /**
   * Guardar incidencia
   */
  async guardarIncidencia() {
    if (!this.validarFormulario()) {
      console.log('❌ Formulario inválido');
      return;
    }

    console.log('💾 Guardando nueva incidencia:', this.nuevaIncidencia);

    // Retornar los datos al componente padre
    this.modalCtrl.dismiss({
      action: 'guardar',
      incidencia: this.nuevaIncidencia
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
}
