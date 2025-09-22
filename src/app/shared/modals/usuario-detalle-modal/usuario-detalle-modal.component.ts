import { Component, OnInit, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface UsuarioDetalle {
  id: number;
  nombre_completo: string;
  cedula: string;
  celular: string;
  correo: string;
  lugar_votacion?: string;
  is_active: boolean;
  municipio_id: number;
  municipio: string;
  rol_id: number;
  rol: string;
  created_by: number;
  created_at: string;
  rating: number;
  permisos: {
    puede_registrar_usuarios: boolean;
    puede_ver_metricas: boolean;
    puede_gestionar_roles: boolean;
    acceso_completo: boolean;
  };
  registers: number;
}

@Component({
  selector: 'app-usuario-detalle-modal',
  templateUrl: './usuario-detalle-modal.component.html',
  styleUrls: ['./usuario-detalle-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class UsuarioDetalleModalComponent implements OnInit {
  @Input() usuarioId!: number;

  usuario: UsuarioDetalle | null = null;
  loading = true;
  error = '';

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient
  ) { }

  ngOnInit() {
    console.log('👤 Cargando detalle del usuario ID:', this.usuarioId);
    this.cargarUsuario();
  }

  /**
   * Obtiene headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Cargar información del usuario
   */
  async cargarUsuario() {
    try {
      this.loading = true;
      const response = await this.http.get<UsuarioDetalle>(
        `${environment.apiUrl}/usuarios/${this.usuarioId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response) {
        this.usuario = response;
        console.log('✅ Usuario cargado:', this.usuario);
      }
    } catch (error: any) {
      console.error('❌ Error al cargar usuario:', error);

      // Manejo específico de errores de autenticación
      if (error.status === 401 || error.status === 403) {
        this.error = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        console.error('🔐 Error de autenticación - verificar token');
      } else {
        this.error = 'No se pudo cargar la información del usuario';
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Cerrar modal
   */
  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  /**
   * Obtener iniciales del nombre
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
   * Obtener cantidad de estrellas para rating
   */
  getStarCount(): number {
    return Math.round(this.usuario?.rating || 0);
  }

  /**
   * Obtener lista de permisos activos
   */
  getPermissionsList(): string[] {
    if (!this.usuario?.permisos) return [];

    const permisos: string[] = [];
    if (this.usuario.permisos.puede_registrar_usuarios) permisos.push('Registrar Usuarios');
    if (this.usuario.permisos.puede_ver_metricas) permisos.push('Ver Métricas');
    if (this.usuario.permisos.puede_gestionar_roles) permisos.push('Gestionar Roles');
    if (this.usuario.permisos.acceso_completo) permisos.push('Acceso Completo');

    return permisos;
  }

  /**
   * Formatear fecha de registro
   */
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtener color del rol
   */
  getRolColor(): string {
    switch (this.usuario?.rol) {
      case 'super_admin': return 'danger';
      case 'admin': return 'warning';
      case 'lider': return 'primary';
      case 'votante': return 'success';
      default: return 'medium';
    }
  }

  /**
   * Obtener etiqueta del rol
   */
  getRolLabel(): string {
    switch (this.usuario?.rol) {
      case 'super_admin': return 'Super Administrador';
      case 'admin': return 'Administrador';
      case 'lider': return 'Líder';
      case 'votante': return 'Votante';
      default: return this.usuario?.rol || 'Sin rol';
    }
  }
}
