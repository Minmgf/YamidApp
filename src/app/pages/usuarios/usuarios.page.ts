import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserRegistrationService } from '../../services/user-registration.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { UsuarioDetalleModalComponent } from '../../shared/modals/usuario-detalle-modal/usuario-detalle-modal.component';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  correo: string;
  cedula: string;
  celular: string;
  municipio: string;
  municipio_id: number;
  lugar_votacion: string;
  rol: string;
  rol_id: number;
  created_by: number;
  created_at: string;
  estado: string;
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: false,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0', opacity: '0', overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '*', opacity: '1' }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: '1', overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '0', opacity: '0' }))
      ])
    ])
  ]
})
export class UsuariosPage implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroSeleccionado: string = 'todos';
  municipioSeleccionado: string = '';
  municipiosDisponibles: string[] = [];
  isLoading: boolean = true;
  searchTerm: string = '';
  mostrarFiltros: boolean = false;

  // Paginación
  currentPage: number = 1;
  pageSize: number = 50;
  totalUsuarios: number = 0;
  totalPages: number = 0;

  filtros = [
    { value: 'todos', label: 'Todos los usuarios', count: 0 },
    { value: '1', label: 'Super Admins', count: 0 },
    { value: '2', label: 'Líderes Principales', count: 0 },
    { value: '3', label: 'Simpatizantes', count: 0 },
    { value: '4', label: 'Aliados', count: 0 }
  ];

  currentUser: any = null;

  constructor(
    private userService: UserRegistrationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    console.log('UsuariosPage ngOnInit iniciado');
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);

    // Verificar que el usuario sea super admin
    if (!this.currentUser || this.currentUser.rol_id !== 1) {
      console.log('Usuario no es super admin, redirigiendo...');
      this.router.navigate(['/welcome']);
      return;
    }

    // Asegurar que los filtros siempre estén disponibles
    console.log('Filtros iniciales:', this.filtros);

    this.loadUsuarios();

    // Forzar detección de cambios inicial
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  /**
   * Carga los usuarios con paginación
   */
  loadUsuarios() {
    this.isLoading = true;

    const rolId = this.filtroSeleccionado !== 'todos' ? parseInt(this.filtroSeleccionado) : undefined;

    this.userService.getAllUsers(
      this.currentPage,
      this.pageSize,
      rolId,
      this.municipioSeleccionado,
      this.searchTerm
    ).subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);

        if (response && response.success && Array.isArray(response.data)) {
          this.usuarios = response.data;
          this.usuariosFiltrados = response.data;

          // Datos de paginación
          this.totalUsuarios = response.total || 0;
          this.totalPages = Math.ceil(this.totalUsuarios / this.pageSize);

          // Actualizar contadores desde la API
          if (response.roles && Array.isArray(response.roles)) {
            this.actualizarContadoresDesdeAPI(response.roles);
          }

          this.extraerMunicipiosUnicos();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Extrae los municipios únicos de la lista de usuarios
   */
  extraerMunicipiosUnicos() {
    const municipiosSet = new Set<string>();
    this.usuarios.forEach(usuario => {
      if (usuario.municipio && usuario.municipio.trim()) {
        municipiosSet.add(usuario.municipio);
      }
    });
    this.municipiosDisponibles = Array.from(municipiosSet).sort();
  }

  /**
   * Actualiza los contadores desde la respuesta de la API
   */
  actualizarContadoresDesdeAPI(roles: { id: number; nombre: string; cantidad: number }[]) {
    const rolesMap = new Map(roles.map(r => [r.id, r.cantidad]));
    const totalGeneral = roles.reduce((sum, r) => sum + r.cantidad, 0);

    this.filtros = [
      { value: 'todos', label: 'Todos los usuarios', count: totalGeneral },
      { value: '1', label: 'Super Admins', count: rolesMap.get(1) || 0 },
      { value: '2', label: 'Líderes Principales', count: rolesMap.get(2) || 0 },
      { value: '3', label: 'Simpatizantes', count: rolesMap.get(3) || 0 },
      { value: '4', label: 'Aliados', count: rolesMap.get(4) || 0 }
    ];

    this.cdr.detectChanges();
    console.log('Contadores actualizados desde API:', this.filtros);
  }

  /**
   * Maneja el cambio de filtro
   */
  onFiltroChange(filtro: string | number | undefined) {
    this.filtroSeleccionado = String(filtro || 'todos');
    this.currentPage = 1;
    this.loadUsuarios();
  }

  /**
   * Maneja el cambio de municipio
   */
  onMunicipioChange() {
    this.currentPage = 1;
    this.loadUsuarios();
  }

  /**
   * Maneja la búsqueda
   */
  onSearchChange() {
    this.currentPage = 1;
    this.loadUsuarios();
  }

  /**
   * Ir a la página anterior
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsuarios();
    }
  }

  /**
   * Ir a la página siguiente
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsuarios();
    }
  }

  /**
   * Ir a una página específica
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsuarios();
    }
  }

  /**
   * Refresca la lista de usuarios
   */
  doRefresh(event: any) {
    this.loadUsuarios();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Obtiene el color del chip según el rol
   */
  getRolColor(rolId: number): string {
    switch (rolId) {
      case 1: return 'danger';   // Super Admins - rojo
      case 2: return 'primary';  // Líderes Principales - azul
      case 3: return 'success';  // Simpatizantes - verde
      case 4: return 'warning';  // Aliados - naranja
      default: return 'medium';
    }
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
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Alterna la visibilidad de los filtros
   */
  toggleFiltros() {
    this.mostrarFiltros = !this.mostrarFiltros;
    console.log('Toggle filtros:', this.mostrarFiltros);
    console.log('Filtros array:', this.filtros);
  }

  /**
   * Track by function para *ngFor
   */
  trackByValue(index: number, item: any): any {
    return item.value;
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Abrir modal con detalle del usuario
   */
  async abrirDetalleUsuario(usuarioId: number) {
    console.log('🔍 Abriendo detalle del usuario ID:', usuarioId);

    try {
      const modal = await this.modalController.create({
        component: UsuarioDetalleModalComponent,
        componentProps: {
          usuarioId: usuarioId
        },
        cssClass: 'usuario-detalle-modal'
      });

      await modal.present();
    } catch (error) {
      console.error('❌ Error al abrir modal de detalle:', error);
    }
  }
}
