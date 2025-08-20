import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AgendaService, AgendaMensual, AgendaEvento } from '../../../services/agenda.service';
import { UserRegistrationService, Municipio } from '../../../services/user-registration.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-create-agenda-modal',
  templateUrl: './create-agenda-modal.component.html',
  styleUrls: ['./create-agenda-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class CreateAgendaModalComponent implements OnInit {
  @Input() isSuperAdmin: boolean = false;

  agendaForm: FormGroup;
  eventosForm: FormGroup;
  municipios: Municipio[] = [];
  eventos: AgendaEvento[] = [];
  isLoading: boolean = false;
  step: 'agenda' | 'eventos' = 'agenda';

  // Opciones para meses
  meses = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];

  // Generar años (año actual y siguientes 5 años)
  anios: number[] = [];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private agendaService: AgendaService,
    private userService: UserRegistrationService,
    private toast: HotToastService
  ) {
    // Generar años disponibles
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.anios.push(currentYear + i);
    }

    // Formulario para crear agenda mensual
    this.agendaForm = this.fb.group({
      titulo: ['', Validators.required],
      mes: [new Date().getMonth() + 1, Validators.required],
      anio: [currentYear, Validators.required],
      descripcion: [''],
      nota_asesor: ['']
    });

    // Formulario para agregar eventos a la agenda
    this.eventosForm = this.fb.group({
      nombre_evento: ['', Validators.required],
      fecha: ['', Validators.required], // Fecha específica del evento
      municipio_id: ['', Validators.required],
      hora: ['', Validators.required],
      lugar: ['']
    });
  }

  ngOnInit() {
    this.loadMunicipios();

    // Generar título por defecto basado en mes y año seleccionados
    this.agendaForm.get('mes')?.valueChanges.subscribe(() => this.updateTitulo());
    this.agendaForm.get('anio')?.valueChanges.subscribe(() => this.updateTitulo());

    // Generar título inicial
    this.updateTitulo();
  }

  /**
   * Actualiza el título automáticamente basado en mes y año
   */
  updateTitulo() {
    const mes = this.agendaForm.get('mes')?.value;
    const anio = this.agendaForm.get('anio')?.value;

    if (mes && anio) {
      const nombreMes = this.meses.find(m => m.value === mes)?.name;
      const titulo = `Agenda ${nombreMes} ${anio}`;
      this.agendaForm.patchValue({ titulo }, { emitEvent: false });
    }
  }

  /**
   * Carga la lista de municipios
   */
  loadMunicipios() {
    this.userService.getMunicipios().subscribe({
      next: (municipios) => {
        this.municipios = municipios;
      },
      error: (error) => {
        console.error('Error loading municipios:', error);
        this.municipios = [
          { id: 1, nombre: "Neiva" },
          { id: 2, nombre: "Campoalegre" },
          { id: 3, nombre: "Rivera" },
          { id: 4, nombre: "Garzón" },
          { id: 5, nombre: "Pitalito" }
        ];
      }
    });
  }

  /**
   * Crea la agenda mensual
   */
  async crearAgenda() {
    if (this.agendaForm.invalid) {
      this.markFormGroupTouched(this.agendaForm);
      return;
    }

    this.isLoading = true;

    const agendaData = { ...this.agendaForm.value };

    this.agendaService.crearAgendaMensual(agendaData).subscribe({
      next: (response) => {
        if (response.success && response.agenda) {
          this.toast.success('Agenda mensual creada correctamente');
          this.step = 'eventos';
          // Guardar el ID de la agenda creada para agregar eventos
          this.agendaForm.patchValue({ id: response.agenda.id });
        } else {
          this.toast.error(response.message || 'Error al crear la agenda');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al crear agenda:', error);
        this.toast.error('Error al crear la agenda');
        this.isLoading = false;
      }
    });
  }

  /**
   * Agrega un evento a la lista temporal
   */
  agregarEvento() {
    if (this.eventosForm.invalid) {
      this.markFormGroupTouched(this.eventosForm);
      return;
    }

    // Validar que la fecha esté dentro del mes/año de la agenda
    const fechaEvento = new Date(this.eventosForm.value.fecha);
    const mesAgenda = this.agendaForm.get('mes')?.value;
    const anioAgenda = this.agendaForm.get('anio')?.value;

    if (fechaEvento.getMonth() + 1 !== mesAgenda || fechaEvento.getFullYear() !== anioAgenda) {
      this.toast.error(`El evento debe estar dentro del mes ${this.meses.find(m => m.value === mesAgenda)?.name} ${anioAgenda}`);
      return;
    }

    const evento: AgendaEvento = {
      nombre_evento: this.eventosForm.value.nombre_evento,
      fecha: this.eventosForm.value.fecha,
      municipio_id: this.eventosForm.value.municipio_id,
      hora: this.eventosForm.value.hora,
      lugar: this.eventosForm.value.lugar
    };

    this.eventos.push(evento);
    this.eventosForm.reset();
    this.toast.success('Evento agregado a la lista');
  }

  /**
   * Elimina un evento de la lista temporal
   */
  eliminarEvento(index: number) {
    this.eventos.splice(index, 1);
  }

  /**
   * Guarda todos los eventos en la agenda
   */
  async guardarEventos() {
    if (this.eventos.length === 0) {
      this.finalizarCreacion();
      return;
    }

    this.isLoading = true;
    const agendaId = this.agendaForm.get('id')?.value;

    // Guardar eventos uno por uno
    const promises = this.eventos.map(evento => {
      console.log('Guardando evento:', evento);
      return this.agendaService.agregarEvento(agendaId, evento).toPromise();
    });

    try {
      const responses = await Promise.all(promises);

      // Verificar que todas las respuestas sean exitosas
      const todosExitosos = responses.every(response => response?.success);

      if (todosExitosos) {
        this.toast.success(`${this.eventos.length} evento${this.eventos.length !== 1 ? 's' : ''} agregado${this.eventos.length !== 1 ? 's' : ''} correctamente`);
        this.finalizarCreacion();
      } else {
        throw new Error('Algunos eventos no se pudieron guardar');
      }
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      this.toast.error('Error al guardar algunos eventos');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Finaliza el proceso de creación
   */
  finalizarCreacion() {
    this.modalCtrl.dismiss({
      success: true,
      agenda: this.agendaForm.value,
      eventos: this.eventos
    });
  }

  /**
   * Volver al paso anterior
   */
  volverAtras() {
    if (this.step === 'eventos') {
      this.step = 'agenda';
    }
  }

  /**
   * Omitir eventos y finalizar
   */
  omitirEventos() {
    this.finalizarCreacion();
  }

  /**
   * Marca todos los campos como tocados
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (control?.errors && control?.touched) {
      const errors = control.errors;
      if (errors['required']) return `Este campo es requerido`;
    }
    return '';
  }

  /**
   * Cierra el modal sin guardar
   */
  dismiss() {
    this.modalCtrl.dismiss();
  }
}
