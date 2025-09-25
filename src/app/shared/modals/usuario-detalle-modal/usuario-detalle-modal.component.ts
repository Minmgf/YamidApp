import { Component, OnInit, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { IncidenciasService, Incidencia } from '../../../services/incidencias.service';

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

  // Propiedades para incidencias
  incidencias: Incidencia[] = [];
  incidenciasLoading = false;
  incidenciasError = '';
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private incidenciasService: IncidenciasService
  ) { }

  ngOnInit() {
    console.log('👤 Cargando detalle del usuario ID:', this.usuarioId);
    this.cargarUsuario();
    this.cargarIncidencias();
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
   * Cargar incidencias del usuario
   */
  async cargarIncidencias() {
    try {
      this.incidenciasLoading = true;
      this.incidenciasError = '';

      const response = await this.incidenciasService.getIncidenciasPorUsuario(this.usuarioId).toPromise();

      if (response && response.success && response.data) {
        this.incidencias = response.data;
        this.totalPages = Math.ceil(this.incidencias.length / this.itemsPerPage);
        console.log('✅ Incidencias cargadas:', this.incidencias.length);
      } else {
        this.incidencias = [];
        this.totalPages = 0;
      }
    } catch (error: any) {
      console.error('❌ Error al cargar incidencias:', error);
      this.incidenciasError = 'No se pudieron cargar las incidencias';
      this.incidencias = [];
      this.totalPages = 0;
    } finally {
      this.incidenciasLoading = false;
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

  /**
   * Obtener incidencias paginadas
   */
  getIncidenciasPaginadas(): Incidencia[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.incidencias.slice(startIndex, endIndex);
  }

  /**
   * Cambiar página
   */
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Obtener páginas para mostrar en la paginación
   */
  getPages(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages); // Mostrar máximo 5 páginas
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    // Ajustar si no hay suficientes páginas al final
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Obtener ícono para la categoría
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
   * Obtener texto amigable para la categoría
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
   * Obtener clase CSS para el estado de la incidencia
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
   * Obtener texto amigable para el estado
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
   * Formatear fecha para mostrar
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
  }

  /**
   * Contar incidencias por estado
   */
  getCountByEstado(estado: string): number {
    return this.incidencias.filter(i => i.estado === estado).length;
  }
}
