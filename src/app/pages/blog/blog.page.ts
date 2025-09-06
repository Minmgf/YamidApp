import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { IonicModule, LoadingController, AlertController, ToastController, IonModal, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciasService, Incidencia, Municipio } from '../../services/incidencias.service';
import { AuthService } from '../../services/auth.service';
import { DetalleIncidenciaModalComponent } from '../../shared/modals/detalle-incidencia-modal/detalle-incidencia-modal.component';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.page.html',
  styleUrls: ['./blog.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent, CommonModule, FormsModule]
})
export class BlogPage implements OnInit, AfterViewInit {
  @ViewChild('modalIncidencia', { static: false }) modalIncidencia!: IonModal;

  // Tab activo
  tabActivo: 'incidencias' | 'gestionar' = 'incidencias';

  // Variables para incidencias por estado
  incidenciasPublicas: Incidencia[] = [];
  incidenciasPendientes: Incidencia[] = [];
  incidenciasRechazadas: Incidencia[] = [];

  // Variables generales
  municipios: Municipio[] = [];
  loading = false;
  loadingGestion = false;

  // Variables para filtros (tab público)
  filtroCategoria = '';
  filtroMunicipio = '';

  // Variables para paginación (tab público)
  currentPage = 1;
  totalPages = 1;
  totalIncidencias = 0;
  limit = 10;

  // Variables para gestión (tab admin)
  expandedSection: 'pendientes' | 'publicadas' | 'rechazadas' | null = null;

  // Variables para nueva incidencia
  nuevaIncidencia: Partial<Incidencia> = {
    titulo: '',
    categoria: 'otros',
    descripcion: '',
    ciudad_id: undefined
  };

  // Variables para modal
  modoEdicion = false;
  incidenciaEditando: Incidencia | null = null;

  constructor(
    private router: Router,
    private incidenciasService: IncidenciasService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController
  ) { }

  async ngOnInit() {
    console.log('BlogPage ngOnInit iniciado');
    await this.cargarDatosIniciales();
    console.log('BlogPage ngOnInit completado');
  }

  ngAfterViewInit() {
    console.log('🔍 BlogPage AfterViewInit - Verificando ViewChild...');
    console.log('modalIncidencia:', !!this.modalIncidencia);
  }

  /**
   * Cargar datos iniciales
   */
  async cargarDatosIniciales() {
    console.log('Cargando datos iniciales...');
    await this.cargarMunicipios();
    await this.cargarIncidenciasPublicas();
    console.log('Datos iniciales cargados');
  }

  /**
   * Verificar si el usuario es admin
   */
  esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  /**
   * Cambiar tab activo
   */
  cambiarTab(tab: any) {
    console.log('Cambiando tab a:', tab);
    if (tab === 'incidencias' || tab === 'gestionar') {
      this.tabActivo = tab;
      if (tab === 'incidencias') {
        console.log('Cargando incidencias públicas para tab incidencias');
        this.cargarIncidenciasPublicas();
      } else if (tab === 'gestionar' && this.esAdmin()) {
        console.log('Cargando datos de gestión para tab gestionar');
        this.cargarDatosGestion();
      }
    }
  }

  /**
   * Cargar municipios
   */
  async cargarMunicipios() {
    try {
      console.log('Cargando municipios...');
      const municipios = await this.incidenciasService.getMunicipios().toPromise();
      this.municipios = municipios || [];
      console.log('Municipios cargados:', this.municipios.length);

      // Si no hay municipios del servidor, usar datos de prueba
      if (this.municipios.length === 0) {
        console.log('No hay municipios del servidor, usando datos de prueba');
        this.municipios = [
          { id: 1, nombre: 'Bogotá' },
          { id: 2, nombre: 'Medellín' },
          { id: 3, nombre: 'Cali' },
          { id: 4, nombre: 'Barranquilla' },
          { id: 5, nombre: 'Cartagena' }
        ];
      }
    } catch (error) {
      console.error('Error al cargar municipios:', error);
      // Usar datos de prueba en caso de error
      this.municipios = [
        { id: 1, nombre: 'Bogotá' },
        { id: 2, nombre: 'Medellín' },
        { id: 3, nombre: 'Cali' },
        { id: 4, nombre: 'Barranquilla' },
        { id: 5, nombre: 'Cartagena' }
      ];
      await this.mostrarToast('Error al cargar municipios, usando datos de prueba', 'warning');
    }
  }

  /**
   * Cargar incidencias públicas
   */
  async cargarIncidenciasPublicas() {
    this.loading = true;
    try {
      const filtros: any = {
        estado: 'publicada',
        page: this.currentPage,
        limit: this.limit
      };

      if (this.filtroCategoria) {
        filtros.categoria = this.filtroCategoria;
      }

      if (this.filtroMunicipio) {
        filtros.ciudad_id = parseInt(this.filtroMunicipio.toString());
      }

      console.log('🔍 Iniciando carga de incidencias...');
      console.log('📋 Filtros enviados:', filtros);
      console.log('🌐 URL del API:', `${this.incidenciasService['apiUrl']}`);

      const response = await this.incidenciasService.getIncidencias(filtros).toPromise();

      console.log('📥 Respuesta completa del servidor:', response);

      if (response) {
        console.log('✅ Respuesta exitosa recibida');
        console.log('📊 Datos de incidencias:', response.data);
        console.log('📈 Total de incidencias:', response.total);

        this.incidenciasPublicas = response.data || [];
        this.totalIncidencias = response.total || 0;
        this.totalPages = Math.ceil(this.totalIncidencias / this.limit);

        console.log('🎯 Incidencias cargadas en el componente:', this.incidenciasPublicas.length);
        console.log('📄 Total de páginas calculadas:', this.totalPages);
      } else {
        console.log('⚠️ No se recibió respuesta del servidor');
      }      // Si no hay datos del servidor, mostrar datos de prueba
      if (this.incidenciasPublicas.length === 0) {
        console.log('🔄 No hay incidencias del servidor, mostrando datos de prueba');
        this.mostrarDatosPrueba();
      }

    } catch (error) {
      console.error('❌ Error detallado al cargar incidencias:', error);

      if (error && (error as any).status) {
        console.error('📊 Status HTTP:', (error as any).status);
        console.error('📝 Mensaje de error:', (error as any).message);
        console.error('🔗 URL que falló:', (error as any).url);
      }

      await this.mostrarToast('Error al cargar incidencias, mostrando datos de prueba', 'warning');
      this.mostrarDatosPrueba();
    } finally {
      this.loading = false;
    }
  }

  /**
   * Mostrar datos de prueba
   */
  mostrarDatosPrueba() {
    this.incidenciasPublicas = [
      {
        id: 1,
        titulo: 'Semáforo dañado en el centro',
        categoria: 'infraestructura',
        descripcion: 'El semáforo de la intersección principal está intermitente desde hace 3 días, causando problemas de tráfico.',
        ciudad_id: 1,
        ciudad_nombre: 'Bogotá',
        usuario_id: 1,
        fecha_creacion: '2025-09-05T10:30:00Z',
        estado: 'publicada',
        autor: 'Juan Pérez'
      },
      {
        id: 2,
        titulo: 'Falta de alumbrado público',
        categoria: 'servicios_publicos',
        descripcion: 'La calle 15 con carrera 20 no tiene alumbrado público desde hace una semana.',
        ciudad_id: 2,
        ciudad_nombre: 'Medellín',
        usuario_id: 2,
        fecha_creacion: '2025-09-04T15:45:00Z',
        estado: 'publicada',
        autor: 'María García'
      },
      {
        id: 3,
        titulo: 'Hueco en la vía principal',
        categoria: 'infraestructura',
        descripcion: 'Hay un hueco grande en la carrera 30 que está afectando el tránsito vehicular.',
        ciudad_id: 1,
        ciudad_nombre: 'Bogotá',
        usuario_id: 3,
        fecha_creacion: '2025-09-03T08:20:00Z',
        estado: 'publicada',
        autor: 'Carlos Rodríguez'
      },
      {
        id: 4,
        titulo: 'Contaminación del río',
        categoria: 'medio_ambiente',
        descripcion: 'Se observa contaminación del río con residuos industriales en el sector norte.',
        ciudad_id: 3,
        ciudad_nombre: 'Cali',
        usuario_id: 4,
        fecha_creacion: '2025-09-02T12:10:00Z',
        estado: 'publicada',
        autor: 'Ana López'
      }
    ];
    this.totalIncidencias = this.incidenciasPublicas.length;
    this.totalPages = 1;
    console.log('Datos de prueba cargados:', this.incidenciasPublicas);
  }

  /**
   * Cargar datos para gestión (admin)
   */
  async cargarDatosGestion() {
    if (!this.esAdmin()) return;

    this.loadingGestion = true;
    try {
      // Cargar pendientes
      const pendientes = await this.incidenciasService.getIncidencias({
        estado: 'pendiente'
      }).toPromise();
      this.incidenciasPendientes = pendientes?.data || [];

      // Cargar rechazadas
      const rechazadas = await this.incidenciasService.getIncidencias({
        estado: 'rechazada'
      }).toPromise();
      this.incidenciasRechazadas = rechazadas?.data || [];

    } catch (error) {
      console.error('Error al cargar datos de gestión:', error);
      await this.mostrarToast('Error al cargar datos de gestión', 'danger');
    } finally {
      this.loadingGestion = false;
    }
  }

  /**
   * Aplicar filtros de búsqueda
   */
  aplicarFiltros() {
    this.currentPage = 1;
    this.cargarIncidenciasPublicas();
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros() {
    this.filtroCategoria = '';
    this.filtroMunicipio = '';
    this.aplicarFiltros();
  }

  /**
   * Ir a página específica
   */
  irPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cargarIncidenciasPublicas();
    }
  }

  /**
   * Toggle sección expandida en admin
   */
  toggleSection(section: 'pendientes' | 'publicadas' | 'rechazadas') {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  /**
   * Abrir modal para crear nueva incidencia
   */
  abrirModalCrear() {
    this.modoEdicion = false;
    this.nuevaIncidencia = {
      titulo: '',
      categoria: 'otros',
      descripcion: '',
      ciudad_id: undefined
    };
    this.modalIncidencia.present();
  }

  /**
   * Editar incidencia
   */
  editarIncidencia(incidencia: Incidencia) {
    this.modoEdicion = true;
    this.incidenciaEditando = incidencia;
    this.nuevaIncidencia = {
      titulo: incidencia.titulo,
      categoria: incidencia.categoria,
      descripcion: incidencia.descripcion,
      ciudad_id: incidencia.ciudad_id
    };
    this.modalIncidencia.present();
  }

  /**
   * Cerrar modal
   */
  cerrarModal() {
    this.modalIncidencia.dismiss();
    this.modoEdicion = false;
    this.incidenciaEditando = null;
  }

  /**
   * Abrir modal de detalle de incidencia
   */
  async abrirDetalleIncidencia(incidencia: Incidencia) {
    console.log('🔍 Abriendo detalle de incidencia:', incidencia);

    try {
      const modal = await this.modalController.create({
        component: DetalleIncidenciaModalComponent,
        cssClass: 'detalle-incidencia-modal',
        backdropDismiss: true,
        showBackdrop: true,
        animated: true,
        keyboardClose: true,
        componentProps: {
          incidencia: { ...incidencia }, // Crear una copia para evitar referencias
          municipios: this.municipios,
          esAdmin: this.esAdmin()
        }
      });

      console.log('✅ Modal creado, presentando...');
      await modal.present();
      console.log('🚀 Modal presentado exitosamente');

      // Manejar el cierre del modal
      const result = await modal.onDidDismiss();
      console.log('🔒 Modal cerrado, resultado:', result);

      if (result.data) {
        const { action, incidencia: incidenciaAction } = result.data;

        switch (action) {
          case 'aprobar':
            if (incidenciaAction?.id) {
              await this.aprobarIncidencia(incidenciaAction.id);
            }
            break;
          case 'rechazar':
            if (incidenciaAction?.id) {
              await this.rechazarIncidencia(incidenciaAction.id);
            }
            break;
          case 'editar':
            this.editarIncidencia(incidenciaAction);
            break;
        }
      }

    } catch (error) {
      console.error('❌ Error al abrir modal de detalle:', error);
      await this.mostrarToast('Error al abrir detalle de incidencia', 'danger');
    }
  }

  /**
   * Cerrar modal de detalle
   */
  async cerrarModalDetalle() {
    console.log('🔒 Método cerrarModalDetalle ya no es necesario con ModalController');
    // Este método ya no es necesario con el nuevo patrón de ModalController
    // El modal se cierra automáticamente desde el componente modal
  }

  /**
   * Validar formulario
   */
  validarFormulario(): boolean {
    return !!(
      this.nuevaIncidencia.titulo?.trim() &&
      this.nuevaIncidencia.categoria &&
      this.nuevaIncidencia.descripcion?.trim() &&
      this.nuevaIncidencia.ciudad_id
    );
  }

  /**
   * Guardar incidencia (crear o actualizar)
   */
  async guardarIncidencia() {
    if (!this.validarFormulario()) {
      await this.mostrarToast('Por favor completa todos los campos', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.modoEdicion ? 'Actualizando incidencia...' : 'Creando incidencia...'
    });
    await loading.present();

    try {
      if (this.modoEdicion && this.incidenciaEditando) {
        // Actualizar incidencia existente
        await this.incidenciasService.actualizarIncidencia(
          this.incidenciaEditando.id!,
          this.nuevaIncidencia
        ).toPromise();
        await this.mostrarToast('Incidencia actualizada exitosamente', 'success');
      } else {
        // Crear nueva incidencia
        await this.incidenciasService.crearIncidencia(
          this.nuevaIncidencia as Omit<Incidencia, 'id' | 'fecha_creacion' | 'estado' | 'usuario_id'>
        ).toPromise();
        await this.mostrarToast('Incidencia creada exitosamente', 'success');
      }

      this.cerrarModal();
      await this.cargarDatosIniciales();
      if (this.tabActivo === 'gestionar') {
        await this.cargarDatosGestion();
      }
    } catch (error) {
      console.error('Error al guardar incidencia:', error);
      await this.mostrarToast('Error al guardar incidencia', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Aprobar incidencia
   */
  async aprobarIncidencia(id?: number) {
    if (!id) {
      await this.mostrarToast('ID de incidencia no válido', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar aprobación',
      message: '¿Estás seguro de que quieres aprobar esta incidencia?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Aprobando incidencia...'
            });
            await loading.present();

            try {
              await this.incidenciasService.actualizarEstadoIncidencia(id, 'publicada').toPromise();
              await this.mostrarToast('Incidencia aprobada exitosamente', 'success');
              await this.cargarDatosGestion();
              await this.cargarIncidenciasPublicas();
            } catch (error) {
              console.error('Error al aprobar incidencia:', error);
              await this.mostrarToast('Error al aprobar incidencia', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Rechazar incidencia
   */
  async rechazarIncidencia(id?: number) {
    if (!id) {
      await this.mostrarToast('ID de incidencia no válido', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar rechazo',
      message: '¿Estás seguro de que quieres rechazar esta incidencia?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Rechazando incidencia...'
            });
            await loading.present();

            try {
              await this.incidenciasService.actualizarEstadoIncidencia(id, 'rechazada').toPromise();
              await this.mostrarToast('Incidencia rechazada', 'success');
              await this.cargarDatosGestion();
            } catch (error) {
              console.error('Error al rechazar incidencia:', error);
              await this.mostrarToast('Error al rechazar incidencia', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Eliminar incidencia
   */
  async eliminarIncidencia(id?: number) {
    if (!id) {
      await this.mostrarToast('ID de incidencia no válido', 'danger');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar esta incidencia? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Eliminando incidencia...'
            });
            await loading.present();

            try {
              await this.incidenciasService.eliminarIncidencia(id).toPromise();
              await this.mostrarToast('Incidencia eliminada exitosamente', 'success');
              await this.cargarDatosGestion();
              await this.cargarIncidenciasPublicas();
            } catch (error) {
              console.error('Error al eliminar incidencia:', error);
              await this.mostrarToast('Error al eliminar incidencia', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
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
   * Mostrar toast
   */
  async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * Logout
   */
  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
