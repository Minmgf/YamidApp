import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AgendaService, Agenda, AgendaEvento } from '../../../services/agenda.service';
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
  @Input() municipioId?: number;

  agendaForm: FormGroup;
  eventosForm: FormGroup;
  municipios: Municipio[] = [];
  eventos: AgendaEvento[] = [];
  isLoading: boolean = false;
  step: 'agenda' | 'eventos' = 'agenda';

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private agendaService: AgendaService,
    private userService: UserRegistrationService,
    private toast: HotToastService
  ) {
    this.agendaForm = this.fb.group({
      municipio_id: ['', Validators.required],
      fecha: [''], // Ya no es requerido
      nota_asesor: [''] // Valor por defecto
    });

    this.eventosForm = this.fb.group({
      nombre_evento: ['', Validators.required],
      fecha_evento: ['', Validators.required], // Nueva propiedad para fecha del evento
      hora: ['', Validators.required],
      lugar: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadMunicipios();

    if (this.municipioId) {
      this.agendaForm.patchValue({ municipio_id: this.municipioId });
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
   * Crea la agenda
   */
  async crearAgenda() {
    if (this.agendaForm.invalid) {
      this.markFormGroupTouched(this.agendaForm);
      return;
    }

    this.isLoading = true;

    // Si no se especifica fecha, usar fecha actual como referencia
    const agendaData = { ...this.agendaForm.value };
    if (!agendaData.fecha) {
      agendaData.fecha = new Date().toISOString();
    }

    this.agendaService.crearAgenda(agendaData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toast.success('Agenda creada correctamente');
          this.step = 'eventos';
          // Guardar el ID de la agenda creada para agregar eventos
          if (response.data && 'id' in response.data) {
            this.agendaForm.patchValue({ id: response.data.id });
          }
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

    const evento: AgendaEvento = {
      ...this.eventosForm.value,
      fecha_evento: this.eventosForm.value.fecha_evento // Asegurar que se incluya la fecha del evento
    };

    this.eventos.push(evento);
    this.eventosForm.reset();
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

    // Guardar eventos uno por uno, asegurando que tengan fecha_evento
    const promises = this.eventos.map(evento => {
      const eventoConFecha = {
        ...evento,
        agenda_id: agendaId
      };
      console.log('Guardando evento:', eventoConFecha);
      return this.agendaService.agregarEvento(agendaId, eventoConFecha).toPromise();
    });

    try {
      await Promise.all(promises);
      this.toast.success(`${this.eventos.length} evento${this.eventos.length !== 1 ? 's' : ''} agregado${this.eventos.length !== 1 ? 's' : ''} correctamente`);
      this.finalizarCreacion();
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      this.toast.error('Error al guardar algunos eventos');
    }

    this.isLoading = false;
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
