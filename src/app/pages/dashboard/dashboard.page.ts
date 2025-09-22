import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ViewDidEnter, IonicModule, SegmentValue, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { UserCountService, UserLeadersCountService } from '../../services/user-count.service';
import { HeatmapService, HeatmapData } from '../../services/heatmap.service';
import { IncidenciasService } from '../../services/incidencias.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';
import { environment } from '../../../environments/environment';
import { StatusModalComponent } from '../../components/status-modal/status-modal.component';

interface IncidenciaData {
  id: number;
  titulo: string;
  categoria: string;
  descripcion: string;
  ciudad_id: number;
  ciudad_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  fecha_creacion: string;
  estado: string;
}

interface IncidenciasResponse {
  success: boolean;
  data: IncidenciaData[];
  total: number;
  page: number;
  limit: number;
}

interface IncidenciasByMunicipio {
  municipio_id: number;
  municipio: string;
  total_incidencias: number;
  incidencias_pendientes: number;
  incidencias_publicadas: number;
  incidencias_rechazadas: number;
  incidencias_por_categoria: {
    social: number;
    seguridad: number;
    ambiental: number;
    salud: number;
    otros: number;
  };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent, CommonModule, FormsModule]
})
export class DashboardPage implements AfterViewInit, ViewDidEnter, OnInit {
  userCount: number = 0; // Variable para almacenar el conteo
  userLeadersCount: number = 0; // Variable para almacenar el conteo de lideres
  totalIncidencias: number = 0; // Variable para almacenar el total de incidencias
  heatmapData: HeatmapData[] = [];
  totalUsuariosSistema: number = 0;

  // Propiedades para la funcionalidad de tabs del mapa
  tabMapaActivo: string = 'votantes'; // Tab activo por defecto

  // Propiedad para controlar la leyenda y evitar duplicados
  private currentLegend: L.Control | null = null;

  // Propiedades para datos de incidencias reales
  incidenciasData: IncidenciasByMunicipio[] = [];
  allIncidenciasData: IncidenciaData[] = [];

  // Lista de municipios para seleccionar
  municipios: any[] = [];

  private map!: L.Map;

  // Propiedades para notificaciones
  notificationModalOpen: boolean = false;
  selectedNotificationType: 'manual' | 'municipio' = 'manual';
  notificationData = {
    usuarios_ids: [] as number[],
    municipio_id: null as number | null,
    titulo: '',
    mensaje: '',
    datos_extra: {}
  };

  constructor(
    private router: Router,
    private userCountService: UserCountService,
    private userLeadersCountService: UserLeadersCountService,
    private heatmapService: HeatmapService,
    private incidenciasService: IncidenciasService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toast: HotToastService,
    private http: HttpClient
  ) {}

  logout() {
    // Usar el método del AuthService que maneja el desregistro de notificaciones
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * 🔔 FUNCIONALIDADES DE NOTIFICACIONES
   */

  /**
   * Verifica si el usuario actual puede enviar notificaciones (Solo Super Admin)
   */
  canSendNotifications(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Solo super admin puede enviar notificaciones
    return currentUser.rol === 'super_admin';
  }

  /**
   * Abre el modal de notificaciones
   */
  async abrirModalNotificaciones(): Promise<void> {
    if (!this.canSendNotifications()) {
      this.toast.error('No tienes permisos para enviar notificaciones');
      return;
    }

    const alert = await this.alertController.create({
      header: '🔔 Enviar Notificación',
      subHeader: 'Selecciona el tipo de notificación',
      cssClass: 'notification-alert',
      inputs: [
        {
          name: 'tipo',
          type: 'radio',
          label: 'Notificación Manual a Usuarios Específicos',
          value: 'manual',
          checked: true
        },
        {
          name: 'tipo',
          type: 'radio',
          label: 'Notificación a Todo un Municipio',
          value: 'municipio'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: (data) => {
            this.selectedNotificationType = data;
            this.mostrarFormularioNotificacion();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Muestra el formulario según el tipo de notificación
   */
  private async mostrarFormularioNotificacion(): Promise<void> {
    if (this.selectedNotificationType === 'manual') {
      await this.mostrarFormularioManual();
    } else {
      await this.mostrarFormularioMunicipio();
    }
  }

  /**
   * Formulario para notificación manual
   */
  private async mostrarFormularioManual(): Promise<void> {
    const alert = await this.alertController.create({
      header: '📤 Notificación Manual',
      cssClass: 'notification-form-alert',
      inputs: [
        {
          name: 'titulo',
          type: 'text',
          placeholder: 'Título de la notificación',
          value: this.notificationData.titulo
        },
        {
          name: 'mensaje',
          type: 'textarea',
          placeholder: 'Mensaje de la notificación',
          value: this.notificationData.mensaje
        },
        {
          name: 'usuarios_ids',
          type: 'text',
          placeholder: 'IDs de usuarios (separados por comas): 1,2,3',
          value: this.notificationData.usuarios_ids.join(',')
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: (data) => {
            this.enviarNotificacionManual(data);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Formulario para notificación por municipio
   */
  private async mostrarFormularioMunicipio(): Promise<void> {
    // Verificar que tenemos municipios cargados
    if (!this.municipios || this.municipios.length === 0) {
      this.toast.error('No se han cargado los municipios. Intentando cargar...');
      this.loadMunicipios();
      return;
    }

    // Crear opciones de radio para municipios
    const municipioOptions = this.municipios.map(municipio => ({
      name: 'municipio_id',
      type: 'radio' as const,
      label: municipio.nombre,
      value: municipio.id,
      checked: false
    }));

    // Primer modal: Seleccionar municipio
    const municipioAlert = await this.alertController.create({
      header: '🏛️ Seleccionar Municipio',
      subHeader: 'Selecciona el municipio para enviar la notificación:',
      cssClass: 'municipio-select-alert',
      inputs: municipioOptions,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: (municipioId) => {
            if (!municipioId) {
              this.toast.error('Debes seleccionar un municipio');
              return false;
            }
            this.mostrarFormularioNotificacionConMunicipio(municipioId);
            return true;
          }
        }
      ]
    });

    await municipioAlert.present();
  }

  /**
   * Mostrar formulario de notificación después de seleccionar municipio
   */
  private async mostrarFormularioNotificacionConMunicipio(municipioId: number): Promise<void> {
    const municipioSeleccionado = this.municipios.find(m => m.id === municipioId);
    const municipioNombre = municipioSeleccionado ? municipioSeleccionado.nombre : 'Municipio seleccionado';

    const alert = await this.alertController.create({
      header: '📤 Notificación Municipal',
      subHeader: `Enviando a: ${municipioNombre}`,
      cssClass: 'notification-form-alert',
      inputs: [
        {
          name: 'titulo',
          type: 'text',
          placeholder: 'Título de la notificación',
          value: this.notificationData.titulo
        },
        {
          name: 'mensaje',
          type: 'textarea',
          placeholder: 'Mensaje de la notificación',
          value: this.notificationData.mensaje
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: (data) => {
            // Agregar el municipio_id a los datos
            const dataConMunicipio = {
              ...data,
              municipio_id: municipioId
            };
            this.enviarNotificacionMunicipio(dataConMunicipio);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Envía notificación manual
   */
  private enviarNotificacionManual(data: any): void {
    if (!data.titulo || !data.mensaje || !data.usuarios_ids) {
      this.toast.error('Todos los campos son requeridos');
      return;
    }

    // Parsear IDs de usuarios
    const usuarios_ids = data.usuarios_ids.split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id));

    if (usuarios_ids.length === 0) {
      this.toast.error('Debes proporcionar al menos un ID de usuario válido');
      return;
    }

    const notificationPayload = {
      usuarios_ids,
      titulo: data.titulo.trim(),
      mensaje: data.mensaje.trim(),
      datos_extra: {
        tipo: 'manual',
        enviado_desde: 'dashboard',
        timestamp: new Date().toISOString()
      }
    };

    this.toast.loading('Enviando notificación...', {
      duration: 0
    });

    this.notificationService.sendManualNotification(notificationPayload).subscribe({
      next: (response) => {
        this.toast.success(`✅ Notificación enviada a ${usuarios_ids.length} usuarios`);
        console.log('✅ Respuesta de notificación manual:', response);
      },
      error: (error) => {
        console.error('❌ Error enviando notificación manual:', error);
        this.toast.error('Error enviando notificación: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  /**
   * Envía notificación por municipio
   */
  private enviarNotificacionMunicipio(data: any): void {
    if (!data.titulo || !data.mensaje || !data.municipio_id) {
      this.toast.error('Todos los campos son requeridos');
      return;
    }

    const municipio_id = parseInt(data.municipio_id);
    if (isNaN(municipio_id)) {
      this.toast.error('El ID del municipio debe ser un número válido');
      return;
    }

    const notificationPayload = {
      municipio_id,
      titulo: data.titulo.trim(),
      mensaje: data.mensaje.trim()
    };

    this.toast.loading('Enviando notificación municipal...', {
      duration: 0
    });

    this.notificationService.sendMunicipalNotification(notificationPayload).subscribe({
      next: (response) => {
        this.toast.success(`✅ Notificación enviada al municipio`);
        console.log('✅ Respuesta de notificación municipal:', response);
      },
      error: (error) => {
        console.error('❌ Error enviando notificación municipal:', error);
        this.toast.error('Error enviando notificación: ' + (error.error?.message || 'Error desconocido'));
      }
    });
  }

  /**
   * Muestra el estado del sistema en un modal dedicado
   */
  async mostrarEstadoNotificaciones(): Promise<void> {
    this.toast.loading('Obteniendo estado del sistema...', {
      duration: 0
    });

    this.notificationService.getNotificationStatus().subscribe({
      next: async (response) => {
        this.toast.success('Estado obtenido correctamente');

        console.log('📊 Respuesta completa del estado:', response);

        // Extraer datos de la respuesta real
        const sistema = response.sistema || {};
        const estadisticas = response.estadisticas || {};
        const scheduler = response.scheduler || {};

        // Crear modal con el componente dedicado
        const modal = await this.modalController.create({
          component: StatusModalComponent,
          cssClass: 'status-modal-wrapper',
          backdropDismiss: true,
          showBackdrop: true,
          componentProps: {
            sistema,
            estadisticas,
            scheduler,
            onRefresh: () => {
              // Función para actualizar el estado
              this.mostrarEstadoNotificaciones();
            }
          }
        });

        await modal.present();
      },
      error: (error) => {
        console.error('❌ Error obteniendo estado:', error);
        this.toast.error('Error obteniendo estado del sistema');
      }
    });
  }  /**
   * Navegación desde las tarjetas del dashboard
   */
  navigateToIncidencias() {
    console.log('🚀 Navegando a página de incidencias...');
    this.router.navigate(['/tabs/blog']);
  }

  navigateToVotantes() {
    console.log('🚀 Navegando a mapa detallado de votantes...');
    this.router.navigate(['/tabs/usuarios']);
  }

  navigateToLideres() {
    console.log('🚀 Navegando a página de líderes...');
    this.router.navigate(['/tabs/usuarios']);
  }

  /**
   * Método para cambiar entre tabs del mapa
   */
  cambiarTabMapa(tab: SegmentValue | undefined) {
    if (!tab || typeof tab !== 'string') return;

    console.log('Cambiando tab del mapa a:', tab);
    this.tabMapaActivo = tab;

    // Aquí puedes agregar lógica adicional para cambiar la visualización del mapa
    // por ejemplo, cargar diferentes datasets según el tab seleccionado
    this.actualizarVisualizacionMapa();
  }

  /**
   * Método para abrir el mapa detallado correspondiente según el tab activo
   */
  abrirMapaDetallado() {
    if (this.tabMapaActivo === 'votantes') {
      this.router.navigate(['/tabs/detailed-map']);
    } else if (this.tabMapaActivo === 'incidencias') {
      this.router.navigate(['/tabs/incidencias-heatmap']);
    }
  }

  /**
   * Método para actualizar la visualización del mapa según el tab activo
   */
  private actualizarVisualizacionMapa() {
    if (!this.map) return;

    // Limpiar leyenda anterior si existe
    if (this.currentLegend) {
      this.map.removeControl(this.currentLegend);
      this.currentLegend = null;
    }

    // Limpiar capas existentes (excepto el mapa base y los límites municipales)
    this.map.eachLayer((layer) => {
      // Solo remover marcadores y círculos, mantener tiles y GeoJSON
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Cargar visualización correspondiente
    if (this.tabMapaActivo === 'votantes') {
      this.loadHeatmapVisualization(); // Datos de votantes existentes
    } else if (this.tabMapaActivo === 'incidencias') {
      this.loadIncidenciasVisualization(); // Función para incidencias
    }
  }

  /**
   * Cargar datos reales de incidencias desde la API
   */
  private loadIncidenciasDataFromAPI() {
    console.log('🔗 Cargando datos de incidencias usando IncidenciasService...');

    this.incidenciasService.getIncidencias({
      limit: 1000, // Obtener todas las incidencias
      page: 1
    }).subscribe({
      next: (response) => {
        console.log('📊 Datos de incidencias cargados en dashboard:', response);
        if (response.success) {
          // Convertir los datos del servicio al formato esperado por el dashboard
          this.allIncidenciasData = response.data.map(incidencia => ({
            id: incidencia.id || 0,
            titulo: incidencia.titulo,
            categoria: incidencia.categoria,
            descripcion: incidencia.descripcion,
            ciudad_id: incidencia.ciudad_id || 0,
            ciudad_nombre: incidencia.ciudad_nombre || '',
            usuario_id: incidencia.usuario_id || 0,
            usuario_nombre: incidencia.usuario_nombre || '',
            fecha_creacion: incidencia.fecha_creacion || '',
            estado: incidencia.estado || 'pendiente'
          }));
          this.processIncidenciasData();
        } else {
          console.warn('⚠️ Respuesta sin éxito de la API de incidencias');
          this.incidenciasData = [];
        }
      },
      error: (error) => {
        console.error('❌ Error cargando datos de incidencias en dashboard:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error detail:', error.error);

        // Si es error de autenticación, mostrar mensaje específico
        if (error.status === 401 || error.status === 403) {
          console.error('🔐 Error de autenticación - verificar token');
          this.toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        }

        this.incidenciasData = [];
      }
    });
  }

  /**
   * Procesar datos de incidencias agrupándolos por municipio
   */
  private processIncidenciasData() {
    // Agrupar incidencias por municipio
    const municipiosMap = new Map<number, IncidenciasByMunicipio>();

    this.allIncidenciasData.forEach(incidencia => {
      const municipioId = incidencia.ciudad_id;

      if (!municipiosMap.has(municipioId)) {
        municipiosMap.set(municipioId, {
          municipio_id: municipioId,
          municipio: incidencia.ciudad_nombre,
          total_incidencias: 0,
          incidencias_pendientes: 0,
          incidencias_publicadas: 0,
          incidencias_rechazadas: 0,
          incidencias_por_categoria: {
            social: 0,
            seguridad: 0,
            ambiental: 0,
            salud: 0,
            otros: 0
          }
        });
      }

      const municipioData = municipiosMap.get(municipioId)!;
      municipioData.total_incidencias++;

      // Contabilizar por estado
      if (incidencia.estado === 'pendiente') {
        municipioData.incidencias_pendientes++;
      } else if (incidencia.estado === 'publicada') {
        municipioData.incidencias_publicadas++;
      } else if (incidencia.estado === 'rechazada') {
        municipioData.incidencias_rechazadas++;
      }

      // Contabilizar por categoría
      if (municipioData.incidencias_por_categoria.hasOwnProperty(incidencia.categoria)) {
        municipioData.incidencias_por_categoria[incidencia.categoria as keyof typeof municipioData.incidencias_por_categoria]++;
      }
    });

    this.incidenciasData = Array.from(municipiosMap.values());
    console.log('✅ Datos de incidencias procesados:', this.incidenciasData);
  }

  // Variable para controlar el número de intentos del bucle
  private loadIncidenciasRetryCount = 0;
  private readonly MAX_RETRY_ATTEMPTS = 10;

  /**
   * Método para cargar visualización de incidencias con datos reales
   */
  private loadIncidenciasVisualization() {
    console.log('Cargando visualización de incidencias reales...');

    if (!this.map || this.incidenciasData.length === 0) {
      this.loadIncidenciasRetryCount++;

      if (this.loadIncidenciasRetryCount >= this.MAX_RETRY_ATTEMPTS) {
        console.error('❌ Máximo número de intentos alcanzado para cargar visualización de incidencias');
        console.log('🔍 Estado actual:');
        console.log('- Mapa inicializado:', !!this.map);
        console.log('- Datos de incidencias disponibles:', this.incidenciasData.length);
        console.log('- Todos los datos de incidencias:', this.allIncidenciasData.length);
        return;
      }

      console.log(`⏳ Esperando datos de incidencias o mapa... (Intento ${this.loadIncidenciasRetryCount}/${this.MAX_RETRY_ATTEMPTS})`);
      setTimeout(() => this.loadIncidenciasVisualization(), 500);
      return;
    }

    // Resetear contador si llegamos aquí exitosamente
    this.loadIncidenciasRetryCount = 0;

    // Mapeo de coordenadas por ID de municipio (igual que incidencias-heatmap)
    const coordenadasPorId: { [key: number]: [number, number] } = {
      1: [2.9342176864059044, -75.2809120516755], 2: [1.8051011976000793, -75.88969179256021], 3: [2.2596690023095336, -75.77201528148835], 4:[3.2224037822836413, -75.23707438612577],
      5: [2.523221176724979, -75.31561267846055], 6: [2.0639571653007085, -75.78710852929741], 7: [3.152015605212019, -75.05526510157806], 8: [2.6848532937857708, -75.3250311047461],
      9: [3.376806819733095, -74.80275084423351], 10: [2.0137472878289, -75.93992471259988], 11: [2.197557817535256, -75.62935533391476], 12: [2.381257952102255, -75.54907616880458],
      13: [2.023974071979222, -75.7568741063892], 14: [2.584279433545576, -75.45183125317061], 15: [2.6494090642162234, -75.63546779025941], 16: [1.9302726059409736, -76.21517253771985],
      17: [2.198550650524688, -75.97953194616365], 18: [2.389053941052161, -75.89092062343626], 19: [2.5450278538430373, -75.8088806212259], 20: [2.024937212672603, -75.99460905622094],
      21: [2.4493126467097213, -75.77397469633821], 22: [2.888658857296718, -75.43478065345764], 23: [1.7238656109337673, -76.13379235141304], 24: [2.2671726195674426, -75.80376591792776],
      25: [1.8563233315332122, -76.04613678182471], 26: [2.7779503812965016, -75.25753057594031], 27: [1.9915686069197125, -76.04543048051937], 28: [1.882404244189735, -76.27315747780969],
      29: [2.9376192322492187, -75.58661962561581], 30: [1.9774131786192852, -75.79472529859227], 31: [2.113916527144062, -75.82522926495173], 32: [2.4873778076003057, -75.73025765066576],
      33: [3.0679932979549887, -75.13791232250433], 34: [2.741395608516078, -75.56833083652862], 35: [1.9726873092733845, -75.93209728794793], 36: [3.219633614616072, -75.21888720322812],
      37: [2.664409180971756, -75.51836619189542]
    };

    // Calcular estadísticas para normalización
    const maxIncidencias = Math.max(...this.incidenciasData.map(d => d.total_incidencias));
    const minIncidencias = Math.min(...this.incidenciasData.map(d => d.total_incidencias));

    // Crear leyenda para incidencias
    this.createIncidenciasLegend(minIncidencias, maxIncidencias);

    // Crear visualización para cada municipio con incidencias
    this.incidenciasData.forEach((data) => {
      const coordenadas = coordenadasPorId[data.municipio_id] || [2.9273, -75.2819];

      // Calcular intensidad normalizada (0-1) basada en total de incidencias
      const intensidad = maxIncidencias > minIncidencias ?
        (data.total_incidencias - minIncidencias) / (maxIncidencias - minIncidencias) : 0.5;

      // Crear múltiples capas para efecto de glow (simplificado para esta implementación)
      // this.createIncidenciasGlowEffect(coordenadas, intensidad, data);

      // Crear círculo principal con colores específicos para incidencias
      this.createIncidenciasCircle(coordenadas, intensidad, data);

      // Agregar animación de pulso para valores altos (simplificado para esta implementación)
      // if (intensidad > 0.7) {
      //   this.createIncidenciasPulseEffect(coordenadas, data);
      // }

      // Crear número en el centro del círculo
      this.createIncidenciasCenterNumber(coordenadas, data);
    });

    console.log(`✅ Visualización de incidencias reales cargada: ${this.incidenciasData.length} municipios visualizados`);
  }

  openDetailedMap() {
    this.router.navigate(['/tabs/detailed-map']);
  }

  ngOnInit() {
    this.loadUserCount();
    this.loadHeatmapData();
    this.loadUserLeadersCount();
    this.loadTotalIncidencias(); // Cargar total de incidencias
    this.loadIncidenciasDataFromAPI(); // Cargar datos reales de incidencias
    this.loadMunicipios(); // Cargar lista de municipios
  }

  loadUserLeadersCount() {
    this.userLeadersCountService.getUserLeadersCount().subscribe({
      next: (response) => {
        this.userLeadersCount = response.count || response.total || response;
        console.log('User leaders count:', this.userLeadersCount);
      },
      error: (error) => {
        console.error('Error loading user leaders count:', error);
        this.userLeadersCount = 0; // Valor por defecto en caso de error
      }
    });
  }

  loadTotalIncidencias() {
    console.log('🔗 Cargando total de incidencias usando IncidenciasService...');

    this.incidenciasService.getTotalIncidencias().subscribe({
      next: (response) => {
        console.log('📊 Respuesta del endpoint /incidencias/total:', response);
        // El endpoint puede devolver {total: number} o directamente el número
        if (typeof response === 'number') {
          this.totalIncidencias = response;
        } else if (response && typeof response === 'object' && 'total' in response) {
          this.totalIncidencias = response.total;
        } else {
          this.totalIncidencias = 0;
        }
        console.log('✅ Total incidencias asignado:', this.totalIncidencias);
      },
      error: (error) => {
        console.error('❌ Error detallado loading total incidencias:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        this.totalIncidencias = 0; // Valor por defecto en caso de error
      }
    });
  }

  /**
   * Cargar lista de municipios
   */
  loadMunicipios() {
    console.log('🏛️ Cargando lista de municipios...');

    this.incidenciasService.getMunicipios().subscribe({
      next: (response) => {
        console.log('✅ Municipios cargados:', response);
        this.municipios = response;
      },
      error: (error) => {
        console.error('❌ Error cargando municipios:', error);
        this.municipios = [];
      }
    });
  }  loadUserCount() {
    this.userCountService.getUserCount().subscribe({
      next: (response) => {
        this.userCount = response.count || response.total || response;
        console.log('User count:', this.userCount);
      },
      error: (error) => {
        console.error('Error loading user count:', error);
        this.userCount = 0; // Valor por defecto en caso de error
      }
    });
  }

  loadHeatmapData() {
    this.heatmapService.getHeatmapData({ estado: 'todos' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.heatmapData = response.data;
          this.totalUsuariosSistema = response.total_usuarios_sistema;
          console.log('Heatmap data loaded:', this.heatmapData);
        }
      },
      error: (error) => {
        console.error('Error loading heatmap data:', error);
        this.heatmapData = [];
      }
    });
  }

  ngAfterViewInit(): void {
    /** 1. Inicializar el mapa */
    this.map = L.map('map', { attributionControl: false, zoomControl: false });

    /** Pane para controlar superposición */
    this.map.createPane('croquis');
    this.map.getPane('croquis')!.style.zIndex = '450';

    /** 2. Agregar tile layer (mapa base) */
    // Opción 1: Mapa satelital de Esri
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 18
    });

    // Opción 2: Mapa de calles de OpenStreetMap
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // Opción 3: Mapa híbrido (satelital + etiquetas)
    const hybridLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    // Agregar el mapa satelital por defecto
    streetLayer.addTo(this.map);

    // Control de capas para cambiar entre tipos de mapa
    const baseMaps = {
      "Satelital": satelliteLayer,
      "Calles": streetLayer,
      "Híbrido": L.layerGroup([satelliteLayer, hybridLabels])
    };

    // L.control.layers(baseMaps).addTo(this.map);

    /** 3. Dibujar el mapa del Huila */
    this.map.setView([2.9273, -75.2819], 9); // Centrar en Neiva, Huila

    // Cargar el mapa base del Huila
    this.loadHuilaMap();

    /** 5. Cargar gráfica blog */
    const ctx = (document.getElementById('blogChart') as HTMLCanvasElement)?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Semana pasada', 'Esta semana'],
          datasets: [{
            label: 'Artículos',
            data: [5, 7],
            backgroundColor: ['#ccc', '#cbd501'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }
    /** 6. Gráfica de líderes */
    const liderCtx = (document.getElementById('liderChart') as HTMLCanvasElement)?.getContext('2d');
    if (liderCtx) {
      new Chart(liderCtx, {
        type: 'bar',
        data: {
          labels: ['Semana pasada', 'Esta semana'],
          datasets: [{
            label: 'Líderes',
            data: [8, 14],
            backgroundColor: ['#ccc', '#28a745'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }



  }

  ionViewDidEnter() {
    this.map?.invalidateSize();
  }

  /**
   * Carga el mapa del Huila con municipios delimitados
   */
  private loadHuilaMap(): void {
    console.log('🗺️ Cargando mapa del Huila con límites municipales...');

    // Cargar el GeoJSON corregido de municipios del Huila
    fetch('assets/geojson/huila-fixed.geojson')
      .then(r => r.json())
      .then((datos: GeoJSON.FeatureCollection) => {
        console.log('✅ GeoJSON del Huila cargado:', datos.features.length, 'municipios');

        // Crear capa de municipios con bordes delimitados
        const municipiosLayer = L.geoJSON(datos, {
          style: (feature) => ({
            color: '#ffffff',        // Bordes blancos para destacar sobre satelital
            weight: 2,               // Grosor más visible
            opacity: 1,              // Opacidad completa para los bordes
            fill: true,
            fillColor: '#3498db',    // Relleno azul claro
            fillOpacity: 0.2,        // Transparencia para ver el satelital debajo
            dashArray: '5, 5'        // Línea punteada para mejor visibilidad
          }),
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              const props = feature.properties;

              // Popup con información del municipio
              const popupContent = `
                <div class="municipio-info-popup">
                  <h4>🏛️ ${props.municipio}</h4>
                  <div class="municipio-details">
                    <div><strong>ID:</strong> ${props.municipio_id}</div>
                    <div><strong>Código DANE:</strong> ${props.codigo_dane}</div>
                    <div><strong>Departamento:</strong> ${props.departamento}</div>
                  </div>
                </div>
              `;
              layer.bindPopup(popupContent);

              // Efecto hover para resaltar municipio
              layer.on('mouseover', (e: any) => {
                e.target.setStyle({
                  fillOpacity: 0.5,        // Mayor opacidad al hacer hover
                  weight: 3,               // Borde más grueso
                  color: '#f39c12',        // Color naranja para destacar
                  fillColor: '#e74c3c',    // Relleno rojo para resaltar
                  dashArray: ''            // Quitar línea punteada en hover
                });
              });

              layer.on('mouseout', (e: any) => {
                e.target.setStyle({
                  fillOpacity: 0.2,        // Volver a la transparencia original
                  weight: 2,               // Grosor original
                  color: '#ffffff',        // Color blanco original
                  fillColor: '#3498db',    // Relleno azul original
                  dashArray: '5, 5'        // Volver a línea punteada
                });
              });
            }
          }
        }).addTo(this.map);

        // Ajustar vista al departamento completo
        this.map.fitBounds(municipiosLayer.getBounds(), {
          padding: [20, 20],
          maxZoom: 10,
        });

        console.log('✅ Mapa del Huila cargado correctamente con límites municipales');

        // Cargar datos de calor superpuestos
        this.loadHeatmapVisualization();
      })
      .catch(error => {
        console.error('❌ Error cargando GeoJSON del Huila:', error);
        // Fallback: solo cargar datos de calor
        this.loadHeatmapVisualization();
      });
  }

  /**
   * Carga la visualización del mapa de calor con datos reales - VERSIÓN MEJORADA
   */
  private loadHeatmapVisualization(): void {
    if (!this.map || this.heatmapData.length === 0) {
      setTimeout(() => this.loadHeatmapVisualization(), 500);
      return;
    }

    // Mapeo de coordenadas por ID de municipio
    const coordenadasPorId: { [key: number]: [number, number] } = {
      1: [2.9273, -75.2819], 2: [1.8000, -75.8833], 3: [2.4167, -75.6833], 4: [3.2167, -75.2333],
      5: [2.5167, -75.3167], 6: [2.0667, -75.7833], 7: [3.1500, -75.0500], 8: [2.6833, -75.3333],
      9: [3.3667, -74.8000], 10: [2.0167, -75.9333], 11: [2.2000, -75.6333], 12: [2.3833, -75.5500],
      13: [2.0167, -75.7500], 14: [2.5833, -75.4500], 15: [2.6500, -75.6333], 16: [1.9333, -76.2333],
      17: [2.2000, -75.9833], 18: [2.3833, -75.8833], 19: [2.5500, -75.8167], 20: [2.0167, -75.9833],
      21: [2.4500, -75.7833], 22: [2.8833, -75.4333], 23: [2.6167, -75.6167], 24: [2.2667, -75.8000],
      25: [1.8500, -76.1000], 26: [2.7833, -75.2667], 27: [1.8833, -76.0500], 28: [1.8833, -76.2667],
      29: [2.9333, -75.5833], 30: [1.9667, -75.7833], 31: [2.1000, -75.8167], 32: [2.4833, -75.7167],
      33: [3.0667, -75.1333], 34: [2.7333, -75.5667], 35: [1.9667, -75.9333], 36: [3.2167, -75.2167],
      37: [2.6667, -75.4333]
    };

    // Calcular estadísticas para normalización
    const maxUsuarios = Math.max(...this.heatmapData.map(d => d.total_usuarios));
    const minUsuarios = Math.min(...this.heatmapData.map(d => d.total_usuarios));
    const avgUsuarios = this.heatmapData.reduce((sum, d) => sum + d.total_usuarios, 0) / this.heatmapData.length;

    // Crear leyenda del heatmap
    this.createHeatmapLegend(minUsuarios, maxUsuarios, avgUsuarios);

    // Ya no necesitamos listener del mapa para badges

    // Crear visualización mejorada para cada municipio
    this.heatmapData.forEach((data, index) => {
      const coordenadas = coordenadasPorId[data.municipio_id] || [2.9273, -75.2819];

      // Calcular intensidad normalizada (0-1)
      const intensidad = maxUsuarios > minUsuarios ?
        (data.total_usuarios - minUsuarios) / (maxUsuarios - minUsuarios) : 0.5;

      // Crear múltiples capas para efecto de glow
      this.createGlowEffect(coordenadas, intensidad, data);

      // Crear círculo principal con gradiente
      this.createMainHeatmapCircle(coordenadas, intensidad, data);

      // Agregar animación de pulso para valores altos
      if (intensidad > 0.7) {
        this.createPulseEffect(coordenadas, data);
      }

      // Crear número en el centro del círculo
      this.createCenterNumber(coordenadas, data);
    });

    console.log(`✅ Heatmap mejorado cargado: ${this.heatmapData.length} municipios visualizados`);
  }

  /**
   * Crear efecto de resplandor (glow) para el heatmap
   */
  private createGlowEffect(coordenadas: [number, number], intensidad: number, data: any): void {
    const baseRadius = 12 + (intensidad * 20);

    // Crear múltiples círculos concéntricos para efecto glow
    for (let i = 3; i >= 1; i--) {
      const glowRadius = baseRadius + (i * 8);
      const glowOpacity = (0.15 / i) * intensidad;

      L.circleMarker(coordenadas, {
        radius: glowRadius,
        color: 'transparent',
        fillColor: this.getHeatmapGradientColor(intensidad),
        fillOpacity: glowOpacity,
        className: `heatmap-glow-${i}`,
        pane: 'overlayPane'
      }).addTo(this.map);
    }
  }

  /**
   * Crear círculo principal del heatmap con gradiente
   */
  private createMainHeatmapCircle(coordenadas: [number, number], intensidad: number, data: any): void {
    const radius = 12 + (intensidad * 15);
    const colors = this.getHeatmapGradientColors(intensidad);

    const mainCircle = L.circleMarker(coordenadas, {
      radius: radius,
      color: colors.border,
      weight: 2,
      fillColor: colors.fill,
      fillOpacity: 0.8,
      className: 'heatmap-main-circle',
      interactive: true,  // Asegurar que sea interactivo
      bubblingMouseEvents: false  // Evitar que los eventos se propaguen
    }).addTo(this.map);

    // Efectos hover simples
    mainCircle.on('mouseover', () => {
      mainCircle.setStyle({
        radius: radius + 3,
        weight: 3,
        fillOpacity: 0.9
      });
    });

    mainCircle.on('mouseout', () => {
      mainCircle.setStyle({
        radius: radius,
        weight: 2,
        fillOpacity: 0.8
      });
    });

    // Popup opcional con información detallada
    const popupContent = this.createEnhancedPopup(data, intensidad);
    mainCircle.bindPopup(popupContent);
  }

  /**
   * Crear efecto de pulso para valores altos
   */
  private createPulseEffect(coordenadas: [number, number], data: any): void {
    const pulseCircle = L.circleMarker(coordenadas, {
      radius: 25,
      color: '#ff4444',
      weight: 2,
      fillColor: 'transparent',
      className: 'heatmap-pulse',
      interactive: false,  // CRÍTICO: No debe capturar eventos
      bubblingMouseEvents: false  // Evitar propagación de eventos
    }).addTo(this.map);

    // Animación CSS será manejada por las clases
  }

  /**
   * Crear número en el centro del círculo del heatmap
   */
  private createCenterNumber(coordenadas: [number, number], data: any): void {
    const numberMarker = L.marker(coordenadas, {
      icon: L.divIcon({
        className: 'heatmap-center-number',
        html: `<div class="center-number">${data.total_usuarios}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      interactive: false,  // El número no debe ser interactivo
      keyboard: false,     // No responder a eventos de teclado
    }).addTo(this.map);

    // Opcional: agregar tooltip con nombre del municipio
    numberMarker.bindTooltip(data.municipio, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      interactive: false  // El tooltip tampoco debe interferir
    });
  }

  // Funciones de badges clickeables eliminadas - ahora usamos números centrados

  /**
   * Crear leyenda interactiva del heatmap
   */
  private createHeatmapLegend(min: number, max: number, avg: number): void {
    const legend = new (L.Control.extend({
      options: {
        position: 'bottomright'
      },

      onAdd: function(map: any) {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
          <div class="legend-container">
            <h4></h4>
          </div>
        `;
        return div;
      }
    }))();

    this.currentLegend = legend;
    legend.addTo(this.map);
  }

  /**
   * Crear leyenda para incidencias
   */
  private createIncidenciasLegend(min: number, max: number): void {
    const legend = new (L.Control.extend({
      options: {
        position: 'bottomright'
      },

      onAdd: function(map: any) {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
          <div class="legend-container">
            <h4></h4>
          </div>
        `;
        return div;
      }
    }))();

    this.currentLegend = legend;
    legend.addTo(this.map);
  }

  /**
   * Crear círculo para incidencias con colores específicos
   */
  private createIncidenciasCircle(coordenadas: [number, number], intensidad: number, data: any): void {
    const radius = 12 + (intensidad * 15);
    const colors = this.getIncidenciasGradientColors(intensidad);

    const incidenciasCircle = L.circleMarker(coordenadas, {
      radius: radius,
      color: colors.border,
      weight: 2,
      fillColor: colors.fill,
      fillOpacity: 0.8,
      className: 'incidencias-main-circle',
      interactive: true,
      bubblingMouseEvents: false
    }).addTo(this.map);

    // Efectos hover
    incidenciasCircle.on('mouseover', () => {
      incidenciasCircle.setStyle({
        radius: radius + 3,
        weight: 3,
        fillOpacity: 0.9
      });
    });

    incidenciasCircle.on('mouseout', () => {
      incidenciasCircle.setStyle({
        radius: radius,
        weight: 2,
        fillOpacity: 0.8
      });
    });

    // Popup con información de incidencias
    const popupContent = this.createIncidenciasPopup(data, intensidad);
    incidenciasCircle.bindPopup(popupContent);
  }

  /**
   * Crear número central para incidencias
   */
  private createIncidenciasCenterNumber(coordenadas: [number, number], data: any): void {
    const numberMarker = L.marker(coordenadas, {
      icon: L.divIcon({
        className: 'incidencias-center-number',
        html: `<div class="center-number incidencias-number">${data.total_incidencias}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      interactive: false,
      keyboard: false,
    }).addTo(this.map);

    // Tooltip con nombre del municipio
    numberMarker.bindTooltip(data.municipio, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      interactive: false
    });
  }

  /**
   * Obtener colores específicos para incidencias
   */
  private getIncidenciasGradientColors(intensidad: number): {border: string, fill: string} {
    // Usar colores rojizos/naranjas para incidencias (diferente a votantes)
    if (intensidad >= 0.8) return {
      border: '#D32F2F',
      fill: 'rgba(244, 67, 54, 0.7)' // Rojo intenso
    };
    if (intensidad >= 0.6) return {
      border: '#FF5722',
      fill: 'rgba(255, 87, 34, 0.7)' // Naranja rojizo
    };
    if (intensidad >= 0.4) return {
      border: '#FF9800',
      fill: 'rgba(255, 152, 0, 0.7)' // Naranja
    };
    if (intensidad >= 0.2) return {
      border: '#FFC107',
      fill: 'rgba(255, 193, 7, 0.7)' // Amarillo
    };
    return {
      border: '#4CAF50',
      fill: 'rgba(76, 175, 80, 0.7)' // Verde para pocas incidencias
    };
  }

  /**
   * Crear popup para incidencias
   */
  private createIncidenciasPopup(data: any, intensidad: number): string {
    const intensityLabel = intensidad >= 0.7 ? 'Alta' : intensidad >= 0.4 ? 'Media' : 'Baja';
    const intensityColor = intensidad >= 0.7 ? '#FF5722' : intensidad >= 0.4 ? '#FF9800' : '#4CAF50';

    return `
      <div class="enhanced-heatmap-popup">
        <div class="popup-header">
          <div class="header-info">
            <h3>${data.municipio}</h3>
            <span class="density-badge" style="background: ${intensityColor};">Incidencias ${intensityLabel}</span>
          </div>
        </div>

        <div class="popup-stats">
          <div class="stat-row">
            <ion-icon name="alert-circle-outline" class="stat-icon"></ion-icon>
            <span class="stat-value">${data.total_incidencias}</span>
            <span class="stat-label">Total</span>
          </div>

          <div class="stat-row">
            <ion-icon name="time-outline" class="stat-icon pending"></ion-icon>
            <span class="stat-value">${data.incidencias_pendientes}</span>
            <span class="stat-label">Pendientes</span>
          </div>

          <div class="stat-row">
            <ion-icon name="checkmark-circle-outline" class="stat-icon active"></ion-icon>
            <span class="stat-value">${data.incidencias_resueltas}</span>
            <span class="stat-label">Resueltas</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Obtiene color gradiente para el heatmap mejorado
   */
  private getHeatmapGradientColor(intensidad: number): string {
    // Gradiente suave de verde a rojo pasando por amarillo/naranja
    if (intensidad >= 0.8) return '#FF1744'; // Rojo intenso
    if (intensidad >= 0.6) return '#FF6D00'; // Naranja intenso
    if (intensidad >= 0.4) return '#FFD600'; // Amarillo
    if (intensidad >= 0.2) return '#76FF03'; // Verde claro
    return '#00E676'; // Verde intenso
  }

  /**
   * Obtiene colores de borde y relleno para círculos principales
   */
  private getHeatmapGradientColors(intensidad: number): {border: string, fill: string} {
    if (intensidad >= 0.8) return {
      border: '#D32F2F',
      fill: 'rgba(244, 67, 54, 0.7)'
    };
    if (intensidad >= 0.6) return {
      border: '#F57C00',
      fill: 'rgba(255, 152, 0, 0.7)'
    };
    if (intensidad >= 0.4) return {
      border: '#FBC02D',
      fill: 'rgba(255, 235, 59, 0.7)'
    };
    if (intensidad >= 0.2) return {
      border: '#689F38',
      fill: 'rgba(139, 195, 74, 0.7)'
    };
    return {
      border: '#388E3C',
      fill: 'rgba(76, 175, 80, 0.7)'
    };
  }

  /**
   * Obtiene colores para badges informativos
   */
  private getBadgeColor(intensidad: number): {bg: string, text: string, border: string} {
    if (intensidad >= 0.7) return {
      bg: 'linear-gradient(135deg, #FF5722, #D32F2F)',
      text: '#FFFFFF',
      border: '#FF5722'
    };
    if (intensidad >= 0.4) return {
      bg: 'linear-gradient(135deg, #FF9800, #F57C00)',
      text: '#FFFFFF',
      border: '#FF9800'
    };
    return {
      bg: 'linear-gradient(135deg, #4CAF50, #388E3C)',
      text: '#FFFFFF',
      border: '#4CAF50'
    };
  }

  /**
   * Crear popup mejorado con mejor diseño usando Flexbox e Ionicons
   */
  private createEnhancedPopup(data: any, intensidad: number): string {
    const intensityLabel = intensidad >= 0.7 ? 'Alta' : intensidad >= 0.4 ? 'Media' : 'Baja';
    const intensityColor = intensidad >= 0.7 ? '#FF5722' : intensidad >= 0.4 ? '#FF9800' : '#4CAF50';

    return `
      <div class="enhanced-heatmap-popup">
        <div class="popup-header">
          <div class="header-info">
            <h3>${data.municipio}</h3>
            <span class="density-badge" style="background: ${intensityColor};">Densidad ${intensityLabel}</span>
          </div>
        </div>

        <div class="popup-stats">
          <div class="stat-row">
            <ion-icon name="people-outline" class="stat-icon"></ion-icon>
            <span class="stat-value">${data.total_usuarios}</span>
            <span class="stat-label">Total</span>
          </div>

          <div class="stat-row">
            <ion-icon name="checkmark-circle-outline" class="stat-icon active"></ion-icon>
            <span class="stat-value">${data.usuarios_activos}</span>
            <span class="stat-label">Activos</span>
          </div>

          <div class="stat-row">
            <ion-icon name="pause-circle-outline" class="stat-icon inactive"></ion-icon>
            <span class="stat-value">${data.usuarios_inactivos}</span>
            <span class="stat-label">Inactivos</span>
          </div>

          <div class="stat-row progress-row">
            <ion-icon name="bar-chart-outline" class="stat-icon"></ion-icon>
            <div class="progress-mini">
              <div class="progress-fill-mini" style="width: ${data.porcentaje_activos}%; background: ${intensityColor};"></div>
            </div>
            <span class="stat-value">${Math.round(data.porcentaje_activos)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Funciones legacy mantenidas para compatibilidad
   */
  private getHeatmapColor(intensidad: number): string {
    return this.getHeatmapGradientColor(intensidad);
  }

  private getHeatmapFillColor(intensidad: number): string {
    const colors = this.getHeatmapGradientColors(intensidad);
    return colors.fill;
  }

  /**
   * Función legacy para compatibilidad
   */
  private getColor(estado = '') {
    return { rojo: '#ff4d4d', amarillo: '#ffeb3b', verde: '#35c84a' }[estado] ?? '#333';
  }
}
