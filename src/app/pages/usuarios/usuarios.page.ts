import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserRegistrationService } from '../../services/user-registration.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

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
    private cdr: ChangeDetectorRef
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
   * Carga todos los usuarios
   */
  loadUsuarios() {
    this.isLoading = true;

    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        console.log('Respuesta del servidor:', response);

        // El backend devuelve { success: true, data: [...] }
        if (response && response.success && Array.isArray(response.data)) {
          this.usuarios = response.data;
          this.extraerMunicipiosUnicos();
          this.actualizarContadores();
          this.aplicarFiltro();
        } else if (response && Array.isArray(response)) {
          // Fallback si devuelve directamente el array
          this.usuarios = response;
          this.extraerMunicipiosUnicos();
          this.actualizarContadores();
          this.aplicarFiltro();
        }
        this.isLoading = false;
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
   * Actualiza los contadores de cada filtro
   */
  actualizarContadores() {
    // Obtener usuarios base para el cálculo de contadores (sin filtro de municipio)
    let usuariosParaConteo = [...this.usuarios];

    // Si hay un municipio seleccionado, aplicar ese filtro para los contadores
    if (this.municipioSeleccionado && this.municipioSeleccionado.trim()) {
      usuariosParaConteo = usuariosParaConteo.filter(usuario =>
        usuario.municipio === this.municipioSeleccionado
      );
    }

    // Crear un nuevo array para forzar la detección de cambios
    this.filtros = [
      { value: 'todos', label: 'Todos los usuarios', count: usuariosParaConteo.length },
      { value: '1', label: 'Super Admins', count: usuariosParaConteo.filter(u => u.rol_id === 1).length },
      { value: '2', label: 'Líderes Principales', count: usuariosParaConteo.filter(u => u.rol_id === 2).length },
      { value: '3', label: 'Simpatizantes', count: usuariosParaConteo.filter(u => u.rol_id === 3).length },
      { value: '4', label: 'Aliados', count: usuariosParaConteo.filter(u => u.rol_id === 4).length }
    ];

    // Forzar detección de cambios
    this.cdr.detectChanges();
    console.log('Contadores actualizados:', this.filtros);
  }

  /**
   * Aplica el filtro seleccionado
   */
  aplicarFiltro() {
    let usuariosFiltrados = [...this.usuarios];

    console.log('Aplicando filtro:', this.filtroSeleccionado);
    console.log('Usuarios antes del filtro:', usuariosFiltrados.length);

    // Filtrar por rol
    if (this.filtroSeleccionado !== 'todos') {
      const rolId = parseInt(this.filtroSeleccionado);
      usuariosFiltrados = usuariosFiltrados.filter(usuario => usuario.rol_id === rolId);
      console.log('Usuarios después del filtro de rol:', usuariosFiltrados.length);
    }

    // Filtrar por municipio
    if (this.municipioSeleccionado && this.municipioSeleccionado.trim()) {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.municipio === this.municipioSeleccionado
      );
      console.log('Usuarios después del filtro de municipio:', usuariosFiltrados.length);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const termino = this.searchTerm.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre_completo.toLowerCase().includes(termino) ||
        usuario.correo.toLowerCase().includes(termino) ||
        usuario.cedula.includes(termino) ||
        (usuario.celular && usuario.celular.includes(termino))
      );
      console.log('Usuarios después del filtro de búsqueda:', usuariosFiltrados.length);
    }

    this.usuariosFiltrados = usuariosFiltrados;
    console.log('Usuarios finales filtrados:', this.usuariosFiltrados.length);
  }

  /**
   * Maneja el cambio de filtro
   */
  onFiltroChange(filtro: string | number | undefined) {
    this.filtroSeleccionado = String(filtro || 'todos');
    this.aplicarFiltro();
  }

  /**
   * Maneja el cambio de municipio
   */
  onMunicipioChange() {
    // Actualizar contadores cuando cambia el municipio
    this.actualizarContadores();
    this.aplicarFiltro();
  }

  /**
   * Maneja la búsqueda
   */
  onSearchChange() {
    this.aplicarFiltro();
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
}
