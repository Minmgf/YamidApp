import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HotToastService } from '@ngxpert/hot-toast';
import { UserRegistrationService, Municipio, Rol, UsuarioRegistro } from '../../../services/user-registration.service';
import { AuthService } from '../../../services/auth.service';

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
  rolesDisponibles: Rol[] = []; // Roles filtrados según la jerarquía
  isLoading = false;
  showPassword = false;
  currentUserRole: string = '';
  showValidationErrors = false; // Controla cuándo mostrar errores de validación

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toast: HotToastService,
    private userRegistrationService: UserRegistrationService,
    private authService: AuthService
  ) {
    // Crear formulario sin validaciones inicialmente
    this.registerForm = this.fb.group({
      nombre: [''],
      cedula: [''],
      celular: [''],
      email: [''],
      password: [''],
      municipio_id: [''],
      lugar_votacion: [''],
      rol_id: ['']
    });
  }

  /**
   * Aplica las validaciones al formulario
   */
  private applyValidations() {
    this.registerForm.get('nombre')?.setValidators([Validators.required, Validators.minLength(2)]);
    this.registerForm.get('cedula')?.setValidators([Validators.required, Validators.pattern(/^\d{6,10}$/)]);
    this.registerForm.get('celular')?.setValidators([Validators.required, Validators.pattern(/^\d{10}$/)]);
    this.registerForm.get('email')?.setValidators([Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]);
    this.registerForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.registerForm.get('municipio_id')?.setValidators([Validators.required]);
    this.registerForm.get('rol_id')?.setValidators([Validators.required]);

    // Actualizar validaciones en todos los campos
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.getCurrentUserRole();
    this.loadMunicipios();
    this.loadRoles();
  }

  /**
   * Obtiene el rol del usuario actual de la sesión
   */
  getCurrentUserRole() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.rol) {
      this.currentUserRole = currentUser.rol;
      console.log('Rol del usuario actual:', this.currentUserRole);
    } else {
      console.error('No se pudo obtener el rol del usuario actual');
      this.toast.error('Error: No se pudo identificar tu rol de usuario');
    }
  }

  /**
   * Filtra los roles disponibles según la jerarquía del usuario actual
   */
  filterRolesByHierarchy() {
    if (!this.currentUserRole || this.roles.length === 0) {
      this.rolesDisponibles = [];
      return;
    }

    console.log('Filtrando roles para usuario con rol:', this.currentUserRole);
    console.log('Roles totales disponibles:', this.roles);

    switch (this.currentUserRole) {
      case 'super_admin':
        // Super admin puede registrar todos los roles
        this.rolesDisponibles = this.roles.filter(rol => rol.nombre !== 'super_admin');
        break;

      case 'lider_principal':
        // Lider puede registrar aliados y simpatizantes
        this.rolesDisponibles = this.roles.filter(rol =>
          rol.nombre === 'aliado' || rol.nombre === 'simpatizante'
        );
        break;

      case 'simpatizante':
        // Simpatizante solo puede registrar aliados
        this.rolesDisponibles = this.roles.filter(rol => rol.nombre === 'aliado');
        break;

      default:
        // Cualquier otro rol no puede registrar usuarios
        this.rolesDisponibles = [];
        console.warn('Usuario sin permisos de registro:', this.currentUserRole);
        break;
    }

    console.log('Roles disponibles para registro:', this.rolesDisponibles);

    // Si no hay roles disponibles, mostrar mensaje de error
    if (this.rolesDisponibles.length === 0) {
      this.toast.warning('Tu rol no tiene permisos para registrar usuarios');
    }
  }

  /**
   * Obtiene los nombres de los roles disponibles como string
   */
  getRolesDisponiblesNames(): string {
    return this.rolesDisponibles.map(rol => this.formatRoleName(rol.nombre)).join(', ');
  }

  /**
   * Formatea el nombre del rol para mostrar de manera amigable
   */
  formatRoleName(roleName: string | undefined): string {
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
   * Formatea la descripción del rol para mostrar de manera más concisa
   */
  formatRoleDescription(descripcion: string | undefined): string {
    if (!descripcion) return 'Sin descripción';

    // Simplificar las descripciones largas
    if (descripcion.includes('Administrador con acceso completo')) {
      return 'Acceso completo al sistema';
    }
    if (descripcion.includes('puede registrar usuarios')) {
      return 'Puede registrar usuarios';
    }
    if (descripcion.includes('sin permisos de registro')) {
      return 'Sin permisos de registro';
    }
    return descripcion;
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
        // Filtrar roles según la jerarquía después de cargarlos
        this.filterRolesByHierarchy();
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
        // Filtrar roles según la jerarquía después de cargar el fallback
        this.filterRolesByHierarchy();
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
    // Aplicar validaciones y activar la visualización de errores
    this.applyValidations();
    this.showValidationErrors = true;

    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Validar que el rol seleccionado está dentro de los roles permitidos
    const selectedRolId = this.registerForm.get('rol_id')?.value;
    const isRoleAllowed = this.rolesDisponibles.some(rol => rol.id === selectedRolId);

    if (!isRoleAllowed) {
      this.toast.error('El rol seleccionado no está permitido para tu nivel de usuario');
      return;
    }

    this.isLoading = true;
    const formData: UsuarioRegistro = this.registerForm.value;

    // Obtener el ID del usuario actual usando el AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      formData.created_by = Number(currentUser.id);
      console.log('Usuario registrador (created_by):', formData.created_by);
    } else {
      console.error('No se pudo obtener el usuario actual para created_by');
      this.isLoading = false;
      this.toast.error('Error: No se pudo identificar el usuario registrador');
      return;
    }

    this.userRegistrationService.registerUser(formData).subscribe({
      next: async (response) => {
        this.isLoading = false;
        const userName = formData.nombre || 'Usuario';
        this.toast.success(`${userName} registrado correctamente`);
        console.log('Usuario registrado exitosamente:', response);
        this.modalCtrl.dismiss({ success: true});
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
    // Solo mostrar errores si showValidationErrors está activo Y el campo tiene errores
    if (control?.errors && this.showValidationErrors) {
      const errors = control.errors;

      if (errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
      if (errors['pattern']) {
        if (fieldName === 'cedula') return 'La cédula debe tener entre 6 y 10 dígitos';
        if (fieldName === 'celular') return 'El celular debe tener 10 dígitos';
        if (fieldName === 'email') return 'Ingrese un correo electrónico válido';
      }
      if (errors['email']) return 'Ingrese un correo electrónico válido';
    }
    return '';
  }

  /**
   * Verifica si un campo tiene errores Y debe mostrarlos
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control?.errors && this.showValidationErrors);
  }

  /**
   * Obtiene las clases CSS para el input según su estado de validación
   */
  getInputClasses(fieldName: string): string {
    if (this.hasFieldError(fieldName)) {
      return 'ion-invalid';
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
