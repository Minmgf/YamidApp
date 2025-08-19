import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaService, Agenda, AgendaEvento } from '../../services/agenda.service';
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
  agendas: Agenda[] = [];
  eventosProximos: any[] = [];
  isLoading: boolean = true;
  currentUser: any = null;
  fechaActual: Date = new Date();
  private agendasCargadas = 0; // Contador para controlar carga completa

  constructor(
    private router: Router,
    private agendaService: AgendaService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.fechaActual = new Date(); // Actualizar fecha actual

    console.log('Usuario actual:', this.currentUser);
    console.log('Municipio ID:', this.currentUser?.municipio_id);

    if (this.currentUser && this.currentUser.municipio_id) {
      this.loadAgendasDelMunicipio();
    } else {
      console.error('Usuario sin municipio asignado');
      this.isLoading = false;
    }
  }

  /**
   * Carga las agendas del municipio del usuario actual
   */
  loadAgendasDelMunicipio() {
    if (!this.currentUser?.municipio_id) {
      console.error('No hay municipio_id para cargar agendas');
      return;
    }

    console.log(`Cargando agendas para municipio ID: ${this.currentUser.municipio_id}`);
    this.isLoading = true;

    this.agendaService.getAgendasByMunicipio(this.currentUser.municipio_id).subscribe({
      next: (response) => {
        console.log('Respuesta completa del servidor:', response);

        // Verificar si la respuesta es directamente un array (sin wrapper de success/data)
        if (Array.isArray(response)) {
          console.log('Respuesta es un array directo');
          this.agendas = response as Agenda[];
          console.log('Agendas asignadas (Array directo):', this.agendas);
          this.loadEventosParaAgendas();
        }
        // Verificar si tiene la estructura esperada con success y data
        else if (response && response.success && Array.isArray(response.data)) {
          console.log('Respuesta tiene estructura success/data con array');
          this.agendas = response.data;
          console.log('Agendas asignadas (Estructura normal - Array):', this.agendas);
          this.loadEventosParaAgendas();
        }
        // Verificar si tiene estructura success/data con objeto único
        else if (response && response.success && response.data) {
          console.log('Respuesta tiene estructura success/data con objeto único');
          this.agendas = [response.data as Agenda];
          console.log('Agendas asignadas (Estructura normal - Objeto único):', this.agendas);
          this.loadEventosParaAgendas();
        }
        // No hay agendas o formato desconocido
        else {
          console.log('No hay agendas o formato de respuesta desconocido');
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
            // Manejar diferentes formatos de respuesta de eventos
            if (response.eventos && Array.isArray(response.eventos)) {
              agenda.eventos = response.eventos;
            } else if (response.data && Array.isArray(response.data)) {
              agenda.eventos = response.data;
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

    console.log('Agendas a procesar:', this.agendas.length);

    // Recopilar todos los eventos de todas las agendas
    this.agendas.forEach((agenda, index) => {
      console.log(`Agenda ${index + 1}:`, agenda);
      console.log(`Eventos en agenda ${agenda.id}:`, agenda.eventos);

      if (agenda.eventos && agenda.eventos.length > 0) {
        agenda.eventos.forEach(evento => {
          console.log('Procesando evento:', evento);

          // Usar la fecha específica del evento (fecha_evento) si está disponible
          let fechaEvento: Date;

          if (evento.fecha_evento) {
            // Si el evento tiene su propia fecha, usarla
            const fechaEventoStr = evento.fecha_evento.includes('T') ?
              evento.fecha_evento.split('T')[0] : evento.fecha_evento;
            fechaEvento = new Date(`${fechaEventoStr}T${evento.hora}`);
          } else {
            // Fallback: usar la fecha de la agenda
            const fechaAgenda = agenda.fecha.split('T')[0];
            fechaEvento = new Date(`${fechaAgenda}T${evento.hora}`);
          }

          console.log(`Fecha del evento: ${fechaEvento}, Ahora: ${ahora}`);
          console.log(`¿Es futuro? ${fechaEvento > ahora}`);

          // Incluir eventos futuros O eventos de hoy que aún no han pasado
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0); // Medianoche de hoy
          const mañana = new Date(hoy);
          mañana.setDate(mañana.getDate() + 1); // Medianoche de mañana

          if (fechaEvento >= hoy) { // Incluir eventos de hoy y futuros
            const fechaParaMostrar = evento.fecha_evento ?
              (evento.fecha_evento.includes('T') ? evento.fecha_evento.split('T')[0] : evento.fecha_evento) :
              agenda.fecha.split('T')[0];

            const eventoProximo = {
              id: evento.id,
              agenda_id: evento.agenda_id,
              nombre_evento: evento.nombre_evento,
              hora: evento.hora,
              lugar: evento.lugar,
              agenda_fecha: fechaParaMostrar,
              fecha_completa: fechaEvento,
              fecha_evento: evento.fecha_evento // Agregar la fecha específica del evento si existe
            };
            console.log('Agregando evento próximo:', eventoProximo);
            todosLosEventos.push(eventoProximo);
          } else {
            console.log('Evento pasado, no se incluye');
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
  }  /**
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
   * Refresca las agendas
   */
  doRefresh(event: any) {
    this.loadAgendasDelMunicipio();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
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
    return this.currentUser?.rol_id === 1 || this.currentUser?.permisos?.puede_gestionar_roles;
  }

  /**
   * Abre el modal para crear una agenda
   */
  async openCreateAgendaModal() {
    if (!this.canCreateAgenda()) {
      await this.showAlert('Sin permisos', 'No tienes permisos para crear agendas');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: CreateAgendaModalComponent,
      cssClass: 'create-agenda-modal',
      backdropDismiss: false,
      componentProps: {
        municipioId: this.currentUser?.municipio_id
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.success) {
      await this.showAlert('Éxito', 'Agenda creada correctamente');

      // Pequeño delay para asegurar que los eventos se hayan guardado en el backend
      setTimeout(() => {
        this.loadAgendasDelMunicipio(); // Recargar agendas
      }, 1000);
    }
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
