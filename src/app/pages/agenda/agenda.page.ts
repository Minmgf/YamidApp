import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService, AgendaMensual, AgendaEvento } from '../../services/agenda.service';
import { UserRegistrationService } from '../../services/user-registration.service';
import { AuthService } from '../../services/auth.service';
import { CreateAgendaModalComponent } from '../../shared/modals/create-agenda-modal/create-agenda-modal.component';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent, CommonModule, FormsModule]
})
export class AgendaPage implements OnInit {
  agendas: AgendaMensual[] = [];
  todasLasAgendas: any[] = []; // Para super admin - todas las agendas
  eventosProximos: any[] = [];
  municipios: any[] = []; // Lista de municipios para filtros
  isLoading: boolean = true;
  currentUser: any = null;
  fechaActual: Date = new Date();
  private agendasCargadas = 0; // Contador para controlar carga completa

  // Controles de vista y filtros
  vistaActual: 'eventos' | 'gestion' = 'eventos';
  filtroMunicipio: number | 'todos' = 'todos';
  isSuperAdmin: boolean = false;

  constructor(
    private router: Router,
    private agendaService: AgendaService,
    private authService: AuthService,
    private userService: UserRegistrationService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.fechaActual = new Date(); // Actualizar fecha actual
    this.isSuperAdmin = this.currentUser?.rol === 'super_admin';

    console.log('Usuario actual:', this.currentUser);
    console.log('Es super admin:', this.isSuperAdmin);
    console.log('Municipio ID:', this.currentUser?.municipio_id);

    // Cargar municipios para todos los usuarios (para el filtro)
    this.loadMunicipios();

    if (this.isSuperAdmin) {
      this.loadTodasLasAgendas();
    } else if (this.currentUser && this.currentUser.municipio_id) {
      this.loadAgendasDelMunicipio();
    } else {
      console.error('Usuario sin municipio asignado');
      this.isLoading = false;
    }
  }

  /**
   * Carga la lista de municipios (para super admin)
   */
  loadMunicipios() {
    console.log('🏘️ Cargando lista de municipios...');
    this.userService.getMunicipios().subscribe({
      next: (response: any) => {
        console.log('📡 Respuesta cruda de municipios:', response);

        // Manejar diferentes formatos de respuesta
        let municipios = [];
        if (Array.isArray(response)) {
          municipios = response;
        } else if (response.success && Array.isArray(response.data)) {
          municipios = response.data;
        } else if (response.municipios && Array.isArray(response.municipios)) {
          municipios = response.municipios;
        }

        console.log('✅ Municipios procesados:', municipios);
        this.municipios = municipios;

        // Si no hay municipios, usar fallback
        if (this.municipios.length === 0) {
          console.log('⚠️ No se recibieron municipios, usando fallback');
          this.useFallbackMunicipios();
        }
      },
      error: (error) => {
        console.error('❌ Error loading municipios:', error);
        this.useFallbackMunicipios();
      }
    });
  }

  /**
   * Usa municipios fallback cuando la API falla
   */
  private useFallbackMunicipios() {
    // Fallback con municipios estáticos basados en la base de datos real
    this.municipios = [
      { id: 1, nombre: "Neiva" },
      { id: 23, nombre: "Campoalegre" },
      { id: 26, nombre: "Rivera" },
      { id: 4, nombre: "Garzón" },
      { id: 5, nombre: "Pitalito" }
    ];
    console.log('🔄 Usando municipios fallback:', this.municipios);
  }

  /**
   * Carga todas las agendas (solo super admin)
   */
  loadTodasLasAgendas() {
    if (!this.isSuperAdmin) return;

    console.log('Cargando todas las agendas (Super Admin)');
    this.isLoading = true;

    this.agendaService.getAllAgendas().subscribe({
      next: (response) => {
        console.log('Respuesta de todas las agendas:', response);

        if (response.success && response.agendas) {
          this.todasLasAgendas = response.agendas;
          this.agendas = response.agendas; // Para compatibilidad
        } else if (Array.isArray(response)) {
          this.todasLasAgendas = response;
          this.agendas = response;
        } else {
          this.todasLasAgendas = [];
          this.agendas = [];
        }

        console.log('Todas las agendas cargadas:', this.todasLasAgendas);
        this.loadEventosParaTodasLasAgendas();
      },
      error: (error) => {
        console.error('Error al cargar todas las agendas:', error);
        this.todasLasAgendas = [];
        this.agendas = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga eventos para todas las agendas (super admin)
   */
  loadEventosParaTodasLasAgendas() {
    this.agendasCargadas = 0;
    const totalAgendas = this.todasLasAgendas.length;

    if (totalAgendas === 0) {
      this.getEventosProximos();
      return;
    }

    this.todasLasAgendas.forEach(agenda => {
      if (agenda.id) {
        this.agendaService.getEventosByAgenda(agenda.id).subscribe({
          next: (response) => {
            if (response.eventos && Array.isArray(response.eventos)) {
              agenda.eventos = response.eventos;
            } else if (Array.isArray(response)) {
              agenda.eventos = response;
            } else {
              agenda.eventos = [];
            }
            this.agendasCargadas++;

            if (this.agendasCargadas === totalAgendas) {
              this.getEventosProximos();
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error(`Error al cargar eventos para agenda ${agenda.id}:`, error);
            agenda.eventos = [];
            this.agendasCargadas++;

            if (this.agendasCargadas === totalAgendas) {
              this.getEventosProximos();
              this.isLoading = false;
            }
          }
        });
      } else {
        this.agendasCargadas++;
        if (this.agendasCargadas === totalAgendas) {
          this.getEventosProximos();
          this.isLoading = false;
        }
      }
    });
  }

  /**
   * Cambia la vista actual
   */
  cambiarVista(vista: 'eventos' | 'gestion') {
    this.vistaActual = vista;
  }

  /**
   * Aplica filtro por municipio
   */
  aplicarFiltroMunicipio(municipioId: number | 'todos') {
    this.filtroMunicipio = municipioId;
  }

  /**
   * Obtiene las agendas filtradas
   */
  get agendasFiltradas() {
    if (this.filtroMunicipio === 'todos') {
      return this.todasLasAgendas;
    }

    // Filtrar agendas que contengan eventos del municipio seleccionado
    return this.todasLasAgendas.filter(agenda => {
      return agenda.eventos && agenda.eventos.some((evento: any) =>
        evento.municipio_id === this.filtroMunicipio
      );
    });
  }

  /**
   * Obtiene los eventos filtrados
   */
  get eventosProximosFiltrados() {
    if (this.filtroMunicipio === 'todos') {
      return this.eventosProximos;
    }

    return this.eventosProximos.filter(evento => {
      // Para super admin, usar todasLasAgendas
      if (this.isSuperAdmin) {
        const agenda = this.todasLasAgendas.find(a => a.id === evento.agenda_id);
        return agenda && agenda.municipio_id === this.filtroMunicipio;
      } else {
        // Para usuarios normales, verificar si el evento pertenece a un municipio específico
        if (this.todasLasAgendas.length > 0) {
          // El evento ya tiene municipio_id, no necesitamos buscar en agenda
          return evento.municipio_id === this.filtroMunicipio;
        } else {
          // Fallback: verificar en eventos de agendas locales
          return evento.municipio_id === this.filtroMunicipio;
        }
      }
    });
  }

  /**
   * Crear nueva agenda
   */
  async crearAgenda() {
    const modal = await this.modalCtrl.create({
      component: CreateAgendaModalComponent,
      cssClass: 'create-agenda-modal',
      backdropDismiss: false,
      componentProps: {
        municipioId: this.isSuperAdmin ? undefined : this.currentUser?.municipio_id,
        isSuperAdmin: this.isSuperAdmin
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.success) {
      await this.showAlert('Éxito', 'Agenda creada correctamente');
      if (this.isSuperAdmin) {
        this.loadTodasLasAgendas();
      } else {
        this.loadAgendasDelMunicipio();
      }
    }
  }

  /**
   * Editar agenda (modal simple)
   */
  async editarAgenda(agenda: any) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Agenda',
      message: `Modifica los datos de la agenda "${agenda.titulo}"`,
      inputs: [
        {
          name: 'titulo',
          type: 'text',
          placeholder: 'Título de la agenda',
          value: agenda.titulo || ''
        },
        {
          name: 'descripcion',
          type: 'textarea',
          placeholder: 'Descripción de la agenda',
          value: agenda.descripcion || ''
        },
        {
          name: 'nota_asesor',
          type: 'textarea',
          placeholder: 'Nota del asesor',
          value: agenda.nota_asesor || ''
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.confirmarEdicionAgenda(agenda.id, {
              titulo: data.titulo,
              descripcion: data.descripcion,
              nota_asesor: data.nota_asesor
            });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirma la edición de agenda
   */
  confirmarEdicionAgenda(agendaId: number, datos: any) {
    const agendaActualizada: any = {};

    // Solo incluir campos que han cambiado
    if (datos.titulo !== undefined) {
      agendaActualizada.titulo = datos.titulo;
    }

    if (datos.descripcion !== undefined) {
      agendaActualizada.descripcion = datos.descripcion;
    }

    if (datos.nota_asesor !== undefined) {
      agendaActualizada.nota_asesor = datos.nota_asesor;
    }

    console.log('Actualizando agenda:', agendaId, agendaActualizada);

    this.agendaService.actualizarAgenda(agendaId, agendaActualizada).subscribe({
      next: (response) => {
        console.log('Respuesta actualización:', response);
        if (response.success) {
          this.showAlert('Éxito', 'Agenda actualizada correctamente');
          if (this.isSuperAdmin) {
            this.loadTodasLasAgendas();
          } else {
            this.loadAgendasDelMunicipio();
          }
        } else {
          this.showAlert('Error', response.message || 'Error al actualizar la agenda');
        }
      },
      error: (error) => {
        console.error('Error al actualizar agenda:', error);
        this.showAlert('Error', 'Error al actualizar la agenda');
      }
    });
  }

  /**
   * Eliminar agenda
   */
  async eliminarAgenda(agenda: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro que desea eliminar la agenda del ${agenda.municipio_nombre || 'municipio'}? Esta acción eliminará también todos los eventos asociados.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminacionAgenda(agenda.id);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirma la eliminación de agenda
   */
  confirmarEliminacionAgenda(agendaId: number) {
    this.agendaService.eliminarAgenda(agendaId).subscribe({
      next: (response) => {
        if (response.success) {
          this.showAlert('Éxito', 'Agenda eliminada correctamente');
          if (this.isSuperAdmin) {
            this.loadTodasLasAgendas();
          } else {
            this.loadAgendasDelMunicipio();
          }
        } else {
          this.showAlert('Error', response.message || 'Error al eliminar la agenda');
        }
      },
      error: (error) => {
        console.error('Error al eliminar agenda:', error);
        this.showAlert('Error', 'Error al eliminar la agenda');
      }
    });
  }

  /**
   * Agregar evento a agenda (modal simple)
   */
  async agregarEvento(agenda: any) {
    // Primero seleccionar el municipio
    const municipioOptions = this.municipios.map(m => ({
      name: 'municipio_id',
      type: 'radio' as const,
      label: m.nombre,
      value: m.id,
      checked: false
    }));

    const municipioAlert = await this.alertCtrl.create({
      header: 'Seleccionar Municipio',
      message: 'Selecciona el municipio para el evento:',
      inputs: municipioOptions,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Siguiente',
          handler: (municipioId) => {
            if (!municipioId) {
              this.showAlert('Error', 'Debes seleccionar un municipio');
              return false;
            }
            this.mostrarFormularioEvento(agenda, municipioId);
            return true;
          }
        }
      ]
    });

    await municipioAlert.present();
  }

  /**
   * Muestra el formulario del evento después de seleccionar municipio
   */
  async mostrarFormularioEvento(agenda: any, municipioId: number) {
    const municipioNombre = this.getMunicipioNombrePorId(municipioId);

    const alert = await this.alertCtrl.create({
      header: 'Agregar Evento',
      message: `Evento en ${municipioNombre} - Agenda "${agenda.titulo}"`,
      inputs: [
        {
          name: 'nombre_evento',
          type: 'text',
          placeholder: 'Nombre del evento',
          attributes: {
            required: true
          }
        },
        {
          name: 'fecha',
          type: 'date',
          placeholder: 'Fecha del evento',
          min: `${agenda.anio}-${agenda.mes.toString().padStart(2, '0')}-01`,
          max: `${agenda.anio}-${agenda.mes.toString().padStart(2, '0')}-31`,
          attributes: {
            required: true
          }
        },
        {
          name: 'hora',
          type: 'time',
          placeholder: 'Hora del evento (HH:MM)',
          attributes: {
            required: true
          }
        },
        {
          name: 'lugar',
          type: 'text',
          placeholder: 'Lugar del evento'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: (data) => {
            if (!data.nombre_evento || !data.fecha || !data.hora) {
              this.showAlert('Error', 'Todos los campos obligatorios deben estar completos');
              return false;
            }

            // Crear el evento con el municipio ya seleccionado
            const datosConMunicipio = {
              ...data,
              municipio_id: municipioId
            };

            this.confirmarCreacionEvento(agenda.id, datosConMunicipio);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirma la creación de evento
   */
  confirmarCreacionEvento(agendaId: number, datos: any) {
    // Según la nueva estructura del backend, necesita estos campos
    const eventoNuevo = {
      nombre_evento: datos.nombre_evento,
      fecha: datos.fecha, // Fecha específica del evento (YYYY-MM-DD)
      municipio_id: parseInt(datos.municipio_id),
      hora: datos.hora,
      lugar: datos.lugar || ''
    };

    console.log('Creando evento en agenda:', agendaId, eventoNuevo);

    // Usamos el endpoint directo que espera estos campos
    this.agendaService.agregarEvento(agendaId, eventoNuevo as any).subscribe({
      next: (response) => {
        console.log('Respuesta creación evento:', response);
        if (response.success) {
          this.showAlert('Éxito', 'Evento agregado correctamente');
          if (this.isSuperAdmin) {
            this.loadTodasLasAgendas();
          } else {
            this.loadAgendasDelMunicipio();
          }
        } else {
          this.showAlert('Error', response.message || 'Error al crear el evento');
        }
      },
      error: (error) => {
        console.error('Error al crear evento:', error);
        this.showAlert('Error', 'Error al crear el evento');
      }
    });
  }

  /**
   * Editar evento
   */
  async editarEvento(evento: any) {
    // Obtener municipio del evento
    const municipioEvento = this.municipios.find(m => m.id === evento.municipio_id);

    // Formatear fecha para input tipo date (YYYY-MM-DD)
    let fechaFormateada = '';
    if (evento.fecha) {
      const fecha = new Date(evento.fecha);
      if (!isNaN(fecha.getTime())) {
        fechaFormateada = fecha.toISOString().split('T')[0];
      }
    }

    const alert = await this.alertCtrl.create({
      header: 'Editar Evento',
      message: `Modifica los datos del evento "${evento.nombre_evento}"`,
      inputs: [
        {
          name: 'nombre_evento',
          type: 'text',
          placeholder: 'Nombre del evento',
          value: evento.nombre_evento || ''
        },
        {
          name: 'lugar',
          type: 'text',
          placeholder: 'Lugar del evento',
          value: evento.lugar || ''
        },
        {
          name: 'hora',
          type: 'time',
          placeholder: 'Hora del evento',
          value: evento.hora || ''
        },
        {
          name: 'fecha',
          type: 'date',
          placeholder: 'Fecha del evento',
          value: fechaFormateada
        },
        // {
        //   name: 'descripcion',
        //   type: 'textarea',
        //   placeholder: 'Descripción del evento',
        //   value: evento.descripcion || ''
        // },
        {
          name: 'municipio_info',
          type: 'text',
          placeholder: 'Municipio',
          value: municipioEvento ? municipioEvento.nombre : 'Sin municipio asignado',
          disabled: true
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (data) => {
            this.confirmarEdicionEvento(evento.id, {
              nombre_evento: data.nombre_evento,
              lugar: data.lugar,
              hora: data.hora,
              fecha: data.fecha,
              descripcion: data.descripcion
            });
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirma la edición de evento
   */
  confirmarEdicionEvento(eventoId: number, datos: any) {
    this.agendaService.actualizarEvento(eventoId, datos).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showAlert('Éxito', 'Evento actualizado correctamente');
          if (this.isSuperAdmin) {
            this.loadTodasLasAgendas();
          } else {
            this.loadAgendasDelMunicipio();
          }
        } else {
          this.showAlert('Error', response.message || 'Error al actualizar el evento');
        }
      },
      error: (error: any) => {
        console.error('Error al actualizar evento:', error);
        this.showAlert('Error', 'Error al actualizar el evento');
      }
    });
  }

  /**
   * Eliminar evento
   */
  async eliminarEvento(evento: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Está seguro que desea eliminar el evento "${evento.nombre_evento}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmarEliminacionEvento(evento.id);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Confirma la eliminación de evento
   */
  confirmarEliminacionEvento(eventoId: number) {
    this.agendaService.eliminarEvento(eventoId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showAlert('Éxito', 'Evento eliminado correctamente');
          if (this.isSuperAdmin) {
            this.loadTodasLasAgendas();
          } else {
            this.loadAgendasDelMunicipio();
          }
        } else {
          this.showAlert('Error', response.message || 'Error al eliminar el evento');
        }
      },
      error: (error: any) => {
        console.error('Error al eliminar evento:', error);
        this.showAlert('Error', 'Error al eliminar el evento');
      }
    });
  }

  /**
   * Carga las agendas del municipio del usuario actual
   * Si es usuario normal, carga solo su municipio inicialmente
   * pero permite filtrar por otros municipios después
   */
  loadAgendasDelMunicipio() {
    if (!this.currentUser?.municipio_id) {
      console.error('No hay municipio_id para cargar agendas');
      return;
    }

    console.log(`Cargando agendas para municipio ID: ${this.currentUser.municipio_id}`);
    this.isLoading = true;

    // Para usuarios normales, cargar todas las agendas para permitir filtrado
    // pero mostrar solo las de su municipio por defecto
    if (!this.isSuperAdmin) {
      this.loadTodasLasAgendasParaFiltro();
      return;
    }

    this.agendaService.getAllAgendas().subscribe({
      next: (response) => {
        console.log('Respuesta completa del servidor:', response);

        if (response && response.success && response.agendas) {
          console.log('Agendas encontradas:', response.agendas);
          this.agendas = response.agendas;
          this.loadEventosParaAgendas();
        } else {
          console.log('No hay agendas disponibles');
          this.agendas = [];
          this.eventosProximos = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error completo al cargar agendas:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('Error body:', error.error);
        this.agendas = [];
        this.isLoading = false;
        this.showAlert('Error', 'No se pudieron cargar las agendas del municipio');
      }
    });
  }

  /**
   * Carga todas las agendas para usuarios normales (para permitir filtrado)
   */
  loadTodasLasAgendasParaFiltro() {
    console.log('Cargando todas las agendas para filtrado (Usuario normal)');
    this.isLoading = true;

    this.agendaService.getAllAgendas().subscribe({
      next: (response) => {
        console.log('Respuesta de todas las agendas para filtro:', response);

        if (response.success && response.agendas) {
          this.todasLasAgendas = response.agendas;
          this.agendas = response.agendas; // Para compatibilidad
          // Establecer filtro inicial al municipio del usuario
          this.filtroMunicipio = this.currentUser?.municipio_id || 'todos';
        } else if (Array.isArray(response)) {
          this.todasLasAgendas = response;
          this.agendas = response;
          this.filtroMunicipio = this.currentUser?.municipio_id || 'todos';
        } else {
          this.todasLasAgendas = [];
          this.agendas = [];
        }

        console.log('🔍 DEBUG - Todas las agendas cargadas para filtro:', this.todasLasAgendas);
        console.log('🔍 DEBUG - Estructura de primera agenda:', this.todasLasAgendas[0]);
        console.log('🔍 DEBUG - Municipios disponibles:', this.municipios);

        this.loadEventosParaTodasLasAgendas();
      },
      error: (error) => {
        console.error('Error al cargar todas las agendas para filtro:', error);
        this.todasLasAgendas = [];
        this.agendas = [];
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los eventos para todas las agendas
   */
  loadEventosParaAgendas() {
    this.agendasCargadas = 0; // Resetear contador
    const totalAgendas = this.agendas.length;

    if (totalAgendas === 0) {
      this.getEventosProximos();
      return;
    }

    this.agendas.forEach(agenda => {
      if (agenda.id) {
        console.log(`Cargando eventos para agenda ${agenda.id}`);
        this.agendaService.getEventosByAgenda(agenda.id).subscribe({
          next: (response) => {
            console.log(`Eventos para agenda ${agenda.id}:`, response);
            if (response.eventos && Array.isArray(response.eventos)) {
              agenda.eventos = response.eventos;
              console.log(`📋 Eventos cargados para agenda ${agenda.id}:`, response.eventos);
              // Verificar si los nombres de municipio están llegando
              response.eventos.forEach((evento: any, index: number) => {
                console.log(`Evento ${index + 1}:`, {
                  id: evento.id,
                  nombre: evento.nombre_evento,
                  municipio_id: evento.municipio_id,
                  municipio_nombre: evento.municipio_nombre
                });
              });
            } else if (Array.isArray(response)) {
              agenda.eventos = response;
            } else {
              agenda.eventos = [];
            }
            console.log(`Eventos asignados a agenda ${agenda.id}:`, agenda.eventos);
            this.agendasCargadas++;

            // Solo procesar eventos próximos cuando todas las agendas estén cargadas
            if (this.agendasCargadas === totalAgendas) {
              console.log('Todas las agendas cargadas, procesando eventos próximos...');
              this.getEventosProximos();
            }
          },
          error: (error) => {
            console.error(`Error al cargar eventos para agenda ${agenda.id}:`, error);
            agenda.eventos = [];
            this.agendasCargadas++;

            // Aún así, procesar cuando todas estén "procesadas" (aunque haya errores)
            if (this.agendasCargadas === totalAgendas) {
              this.getEventosProximos();
            }
          }
        });
      } else {
        this.agendasCargadas++;
        if (this.agendasCargadas === totalAgendas) {
          this.getEventosProximos();
        }
      }
    });
  }

  /**
   * Obtiene los eventos próximos ordenados por fecha y hora
   */
  getEventosProximos() {
    console.log('Procesando eventos próximos...');
    const ahora = new Date();
    console.log('Fecha/hora actual:', ahora);
    const todosLosEventos: any[] = [];

    // Usar la lista apropiada según el tipo de usuario
    const agendasParaProcesar = this.isSuperAdmin || this.todasLasAgendas.length > 0
      ? this.todasLasAgendas
      : this.agendas;

    console.log('Agendas a procesar:', agendasParaProcesar.length);

    // Recopilar todos los eventos de todas las agendas
    agendasParaProcesar.forEach((agenda, index) => {
      console.log(`Agenda ${index + 1}:`, agenda);
      console.log(`Eventos en agenda ${agenda.id}:`, agenda.eventos);

      if (agenda.eventos && agenda.eventos.length > 0) {
        agenda.eventos.forEach((evento: any) => {
          console.log('🔍 DEBUG - Estructura completa del evento:', evento);
          console.log('🔍 DEBUG - evento.id_agenda:', evento.id_agenda);
          console.log('🔍 DEBUG - agenda.id:', agenda.id);

          // Validar que tenemos los datos necesarios
          if (!evento.fecha || !evento.hora) {
            console.log('⚠️ Evento sin fecha o hora válida, omitiendo:', evento);
            return;
          }

          // Usar la fecha específica del evento
          let fechaEvento: Date;
          let fechaParaMostrar: string;

          try {
            // La fecha viene en formato YYYY-MM-DD
            const fechaEventoStr = evento.fecha.includes('T') ?
              evento.fecha.split('T')[0] : evento.fecha;

            // Crear fecha local sin conversión de zona horaria
            const [year, month, day] = fechaEventoStr.split('-').map(Number);
            const [hours, minutes] = evento.hora.split(':').map(Number);
            fechaEvento = new Date(year, month - 1, day, hours, minutes);
            fechaParaMostrar = fechaEventoStr;

            console.log(`📅 DEBUG - Fecha original: ${evento.fecha}`);
            console.log(`📅 DEBUG - Hora original: ${evento.hora}`);
            console.log(`📅 DEBUG - Fecha procesada: ${fechaEvento}`);
            console.log(`📅 DEBUG - Fecha para mostrar: ${fechaParaMostrar}`);

            console.log(`Fecha del evento: ${fechaEvento}, Ahora: ${ahora}`);
            console.log(`¿Es futuro? ${fechaEvento > ahora}`);

            // Incluir eventos futuros O eventos de hoy que aún no han pasado
            if (fechaEvento > ahora) {
              // Obtener el nombre del municipio desde la lista de municipios cargada
              let municipioNombre = evento.municipio_nombre;
              if (!municipioNombre && evento.municipio_id) {
                const municipio = this.municipios.find(m => m.id === evento.municipio_id);
                municipioNombre = municipio ? municipio.nombre : `Municipio ID: ${evento.municipio_id}`;
                console.log(`🏘️ Fallback - Municipio ID ${evento.municipio_id} → ${municipioNombre}`);
              }

              const eventoProximo = {
                id: evento.id,
                agenda_id: evento.id_agenda || agenda.id, // Usar agenda.id si evento.id_agenda es undefined
                nombre_evento: evento.nombre_evento,
                hora: evento.hora,
                lugar: evento.lugar,
                agenda_fecha: fechaParaMostrar,
                fecha_completa: fechaEvento,
                fecha_evento: evento.fecha, // La fecha específica del evento
                municipio_id: evento.municipio_id,
                municipio_nombre: municipioNombre || 'Sin municipio'
              };
              console.log('Agregando evento próximo:', eventoProximo);
              console.log('🏘️ Municipio ID:', evento.municipio_id, 'Nombre:', municipioNombre);
              todosLosEventos.push(eventoProximo);
            } else {
              console.log('Evento pasado, no se incluye');
            }
          } catch (error) {
            console.error('Error procesando evento:', evento, error);
          }
        });
      } else {
        console.log(`Agenda ${agenda.id} no tiene eventos`);
      }
    });

    // Ordenar por fecha/hora
    this.eventosProximos = todosLosEventos.sort((a, b) =>
      a.fecha_completa.getTime() - b.fecha_completa.getTime()
    );

    console.log('Eventos próximos finales:', this.eventosProximos);
  }

  /**
   * Método de testing para debuggear la carga de eventos
   */
  testEventosAPI() {
    console.log('=== TESTING EVENTOS API ===');
    console.log('Usuario actual:', this.currentUser);
    console.log('Agendas disponibles:', this.agendas);

    // Forzar recarga completa para debug
    this.loadAgendasDelMunicipio();

    // Primero, testear si podemos cargar agendas
    if (this.currentUser?.municipio_id) {
      console.log('Testeando carga de agendas...');
      this.agendaService.getAgendasByMunicipio(this.currentUser.municipio_id).subscribe({
        next: (response) => {
          console.log('Test - Respuesta de agendas:', response);
        },
        error: (error) => {
          console.error('Test - Error en agendas:', error);
        }
      });
    } else {
      console.error('No hay municipio_id para testear');
    }

    if (this.agendas.length > 0) {
      const primeraAgenda = this.agendas[0];
      console.log('Testeando primera agenda:', primeraAgenda);

      this.agendaService.getEventosByAgenda(primeraAgenda.id!).subscribe({
        next: (response) => {
          console.log('Test - Respuesta de eventos API:', response);
          console.log('Test - Eventos específicos:', response.eventos);
        },
        error: (error) => {
          console.error('Test - Error en eventos API:', error);
        }
      });
    } else {
      console.log('No hay agendas para testear eventos');
    }
  }

  /**
   * Método para recargar solo los eventos (útil para debug)
   */
  recargarEventos() {
    console.log('Recargando eventos manualmente...');
    this.loadEventosParaAgendas();
  }

  /**
   * Obtiene el nombre del municipio por ID
   */
  getMunicipioNombrePorId(municipioId: number): string {
    if (!municipioId) return 'Sin municipio';

    const municipio = this.municipios.find(m => m.id === municipioId);
    return municipio ? municipio.nombre : `Municipio ID: ${municipioId}`;
  }

  /**
   * Obtiene el nombre del municipio por agenda ID (DEPRECATED)
   */
  getMunicipioNombre(agendaId: number): string {
    console.log(`🔍 Buscando municipio para agenda ID: ${agendaId}`);

    // Si agendaId es undefined, retornar error descriptivo
    if (agendaId === undefined || agendaId === null) {
      console.log(`❌ agenda_id es undefined o null`);
      return 'ID de agenda indefinido';
    }

    // Buscar primero en todasLasAgendas (para todos los usuarios)
    let agenda = this.todasLasAgendas.find(a => a.id === agendaId);

    // Si no se encuentra, buscar en agendas locales
    if (!agenda) {
      agenda = this.agendas.find(a => a.id === agendaId);
    }

    if (!agenda) {
      console.log(`❌ No se encontró agenda con ID ${agendaId}`);
      return `Agenda ${agendaId} no encontrada`;
    }

    console.log(`✅ Agenda encontrada:`, agenda);

    // Si el agenda tiene el nombre del municipio, usarlo
    if (agenda?.municipio_nombre) {
      console.log(`✅ Municipio encontrado por nombre: ${agenda.municipio_nombre}`);
      return agenda.municipio_nombre;
    }

    // Si no, buscar en la lista de municipios usando municipio_id
    if (agenda?.municipio_id) {
      console.log(`🔍 Buscando municipio con ID: ${agenda.municipio_id}`);
      console.log(`🏘️ Lista de municipios:`, this.municipios);

      const municipio = this.municipios.find(m => m.id === agenda.municipio_id);
      console.log(`🔍 Municipio encontrado:`, municipio);

      if (municipio?.nombre) {
        console.log(`✅ Municipio encontrado por ID: ${municipio.nombre}`);
        return municipio.nombre;
      } else {
        console.log(`❌ No se encontró municipio con ID ${agenda.municipio_id} en la lista`);
        // Fallback: crear un mapeo básico si no está en la lista
        return this.getMunicipioFallback(agenda.municipio_id);
      }
    }

    console.log(`❌ Agenda sin municipio_nombre ni municipio_id`);
    return 'Sin municipio';
  }

  /**
   * Fallback para municipios que no están en la lista cargada
   */
  getMunicipioFallback(municipioId: number): string {
    // Mapeo básico basado en los IDs que vemos en la base de datos
    const municipiosFallback: { [key: number]: string } = {
      1: 'Neiva',
      23: 'Campoalegre',
      26: 'Rivera',
      4: 'Garzón',
      5: 'Pitalito'
      // Agregar más según necesites
    };

    const nombre = municipiosFallback[municipioId];
    console.log(`🔄 Fallback para municipio ${municipioId}: ${nombre || 'No encontrado'}`);
    return nombre || `Municipio ID: ${municipioId}`;
  }

  /**
   * Refresca las agendas
   */
  doRefresh(event: any) {
    if (this.isSuperAdmin) {
      this.loadTodasLasAgendas();
    } else {
      this.loadAgendasDelMunicipio();
    }
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) sin hora
    let fechaSolo = dateString;
    if (dateString.includes('T')) {
      fechaSolo = dateString.split('T')[0];
    }

    console.log(`📅 Formateando fecha: "${dateString}" → "${fechaSolo}"`);

    // Crear fecha local sin conversión de zona horaria
    const [year, month, day] = fechaSolo.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11

    console.log(`📅 Fecha creada: ${date}`);

    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  /**
   * Formatea la hora para mostrar
   */
  formatTime(timeString: string): string {
    // Si viene en formato HH:mm, convertir a formato 12 horas
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Muestra una alerta
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Verifica si el usuario puede crear agendas
   */
  canCreateAgenda(): boolean {
    return this.isSuperAdmin || this.currentUser?.rol_id === 1 || this.currentUser?.permisos?.puede_gestionar_roles;
  }

  /**
   * Abre el modal para crear una agenda
   */
  async openCreateAgendaModal() {
    if (!this.canCreateAgenda()) {
      await this.showAlert('Sin permisos', 'No tienes permisos para crear agendas');
      return;
    }

    await this.crearAgenda();
  }

  /**
   * Obtiene el nombre del mes por número
   */
  getMesNombre(mes: number): string {
    const meses = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes] || 'Mes inválido';
  }

  /**
   * Agrupa los eventos de una agenda por municipio
   */
  getEventosPorMunicipios(agenda: any): Array<{municipio_id: number, municipio_nombre: string, eventos: any[]}> {
    if (!agenda.eventos || agenda.eventos.length === 0) {
      return [];
    }

    const gruposPorMunicipio = new Map();

    agenda.eventos.forEach((evento: any) => {
      const municipioId = evento.municipio_id;
      const municipioNombre = evento.municipio_nombre || this.getMunicipioNombrePorId(municipioId);

      if (!gruposPorMunicipio.has(municipioId)) {
        gruposPorMunicipio.set(municipioId, {
          municipio_id: municipioId,
          municipio_nombre: municipioNombre,
          eventos: []
        });
      }

      gruposPorMunicipio.get(municipioId).eventos.push(evento);
    });

    return Array.from(gruposPorMunicipio.values()).sort((a, b) =>
      a.municipio_nombre.localeCompare(b.municipio_nombre)
    );
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
