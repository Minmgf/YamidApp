import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HotToastService } from '@ngxpert/hot-toast';
import { UserRegistrationService, Municipio, Rol, UsuarioRegistro } from '../../../services/user-registration.service';

@Component({
  selector: 'app-register-user-modal',
  templateUrl: './register-user-modal.component.html',
  styleUrls: ['./register-user-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class RegisterUserModalComponent implements OnInit {
  registerForm: FormGroup;
  municipios: Municipio[] = [];
  roles: Rol[] = [];
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toast: HotToastService,
    private userRegistrationService: UserRegistrationService
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      cedula: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      celular: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      municipio_id: ['', Validators.required],
      lugar_votacion: [''],
      rol_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadMunicipios();
    this.loadRoles();
  }
  /**
   * Carga la lista de municipios
   */
  loadMunicipios() {
    this.userRegistrationService.getMunicipios().subscribe({
      next: (municipios) => {
        this.municipios = municipios;
        console.log('Municipios cargados:', municipios.length);
      },
      error: (error) => {
        console.error('Error loading municipios:', error);
        // Fallback con municipios del Huila como ejemplo
        this.municipios = [
          { id: 1, nombre: "Neiva" },
          { id: 2, nombre: "Campoalegre" },
          { id: 3, nombre: "Rivera" },
          { id: 4, nombre: "Garzón" },
          { id: 5, nombre: "Pitalito" },
          { id: 6, nombre: "La Plata" },
          { id: 7, nombre: "Gigante" },
          { id: 8, nombre: "Aipe" },
          { id: 9, nombre: "Palestina" }
        ];
        this.toast.warning('Se cargaron municipios desde datos locales. Verifica tu conexión');
      }
    });
  }
  /**
   * Carga la lista de roles
   */
  loadRoles() {
    this.userRegistrationService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        console.log('Roles cargados:', roles.length);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Fallback con datos hardcodeados basados en tu API
        this.roles = [
          {
            id: 1,
            nombre: "super_admin",
            descripcion: "Administrador con acceso completo al sistema"
          },
          {
            id: 2,
            nombre: "lider_principal",
            descripcion: "Líder principal que puede registrar usuarios"
          },
          {
            id: 3,
            nombre: "simpatizante",
            descripcion: "Simpatizante que puede registrar usuarios"
          },
          {
            id: 4,
            nombre: "aliado",
            descripcion: "Aliado sin permisos de registro ni métricas"
          }
        ];
        this.toast.warning('Se cargaron roles desde datos locales. Verifica tu conexión');
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Envía el formulario de registro
   */
  async onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formData: UsuarioRegistro = this.registerForm.value;

    // Obtener el ID del usuario actual desde localStorage
    const currentUserData = localStorage.getItem('userData');
    if (currentUserData) {
      try {
        const userData = JSON.parse(currentUserData);
        formData.created_by = userData.id || userData.user_id;
      } catch (error) {
        console.warn('Error al obtener datos del usuario actual:', error);
        // Si no se puede obtener el ID, usar un valor por defecto o mostrar error
        formData.created_by = 1; // Valor por defecto
      }
    } else {
      // Si no hay datos de usuario, usar valor por defecto
      formData.created_by = 1;
    }

    this.userRegistrationService.registerUser(formData).subscribe({
      next: async (response) => {
        this.isLoading = false;
        const userName = formData.nombre || 'Usuario';
        this.toast.success(`${userName} registrado correctamente`);
        console.log('Usuario registrado exitosamente:', response);
        this.modalCtrl.dismiss({ success: true, user: response.user });
      },
      error: async (error) => {
        this.isLoading = false;
        const errorMessage = this.extractErrorMessage(error);
        this.toast.error(errorMessage);
        console.error('Error al registrar usuario:', error);
      }
    });
  }

  /**
   * Marca todos los campos del formulario como tocados para mostrar errores
   */
  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cierra el modal
   */
  dismiss() {
    this.modalCtrl.dismiss();
  }

  /**
   * Obtiene el mensaje de error para un campo específico
   */
  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.errors && control?.touched) {
      const errors = control.errors;

      if (errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
      if (errors['pattern']) {
        if (fieldName === 'cedula') return 'La cédula debe tener entre 8 y 10 dígitos';
        if (fieldName === 'celular') return 'El celular debe tener 10 dígitos';
        if (fieldName === 'email') return 'Ingrese un correo electrónico válido';
      }
      if (errors['email']) return 'Ingrese un correo electrónico válido';
    }
    return '';
  }

  /**
   * Obtiene la etiqueta amigable del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      cedula: 'Cédula',
      celular: 'Celular',
      email: 'Correo electrónico',
      password: 'Contraseña',
      municipio_id: 'Municipio',
      rol_id: 'Rol'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Extrae el mensaje de error más específico de la respuesta del servidor
   */
  private extractErrorMessage(error: any): string {
    console.log('Error completo recibido:', error);

    // Caso 1: error.error es string directo (ej: "La cédula ya está registrada")
    if (error.error && typeof error.error === 'string') {
      return `${error.error}`;
    }

    // Caso 2: error.error.error existe (estructura: {error: "mensaje"})
    if (error.error?.error && typeof error.error.error === 'string') {
      return `${error.error.error}`;
    }

    // Caso 3: error.error.message existe (estructura: {message: "mensaje"})
    if (error.error?.message && typeof error.error.message === 'string') {
      return `${error.error.message}`;
    }

    // Caso 4: error.message existe (error de red o HTTP)
    if (error.message && typeof error.message === 'string') {
      return `${error.message}`;
    }

    // Caso 5: Error HTTP con status específico
    if (error.status) {
      switch (error.status) {
        case 400:
          return 'Datos inválidos. Verifica la información ingresada';
        case 401:
          return 'No tienes permisos para realizar esta acción';
        case 403:
          return 'Acceso denegado';
        case 404:
          return 'Servicio no encontrado';
        case 409:
          return 'El usuario ya existe en el sistema';
        case 422:
          return 'Datos no válidos. Revisa los campos del formulario';
        case 500:
          return 'Error interno del servidor. Intenta más tarde';
        case 503:
          return 'Servicio no disponible temporalmente';
        default:
          return `Error del servidor (${error.status})`;
      }
    }

    // Caso 6: Error de red (sin conexión)
    if (error.name === 'HttpErrorResponse' && error.status === 0) {
      return 'Sin conexión al servidor. Verifica tu conexión a internet';
    }

    // Mensaje por defecto
    return 'Error al registrar usuario. Intenta nuevamente';
  }
}
