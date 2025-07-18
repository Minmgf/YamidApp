import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavController } from '@ionic/angular';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class LoginPage {
  form: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: HotToastService,
    private navCtrl: NavController
  ) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, this.emailOrCedulaValidator]],
      password: ['', Validators.required],
    });
  }

  /**
   * Validador personalizado que acepta email o cédula
   */
  emailOrCedulaValidator(control: any) {
    if (!control.value) return null;

    const value = control.value.trim();

    // Si es solo números, validar como cédula (8-10 dígitos)
    if (/^\d+$/.test(value)) {
      return /^\d{8,10}$/.test(value) ? null : { invalidCedula: true };
    }

    // Si contiene @, validar como email
    if (value.includes('@')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value) ? null : { invalidEmail: true };
    }

    // Si no es ni número ni contiene @, es inválido
    return { invalidFormat: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Obtiene el mensaje de error para el campo identifier (email/cédula)
   */
  getEmailErrorMessage(): string {
    const control = this.form.get('identifier');
    if (control?.errors && control?.touched) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['invalidEmail']) return 'Correo electrónico inválido';
      if (control.errors['invalidCedula']) return 'La cédula debe tener entre 8 y 10 dígitos';
      if (control.errors['invalidFormat']) return 'Ingrese un correo electrónico o cédula válidos';
    }
    return '';
  }

  async submit() {
    if (this.form.invalid) {
      this.toast.warning('Complete todos los campos correctamente');
      return;
    }

    const { identifier, password } = this.form.value;
    this.authService.login(identifier, password).subscribe({
      next: (response) => {
        console.log('Login exitoso, respuesta:', response);

        // Verificar que el usuario se guardó correctamente
        const currentUser = this.authService.getCurrentUser();
        console.log('Usuario actual después del login:', currentUser);

        // Obtener la ruta por defecto
        const defaultRoute = this.authService.getDefaultRoute();
        console.log('Ruta por defecto:', defaultRoute);

        this.toast.success('¡Bienvenido!');

        // Navegación con un pequeño delay para asegurar que el estado se actualice
        setTimeout(() => {
          this.navCtrl.navigateRoot(defaultRoute);
        }, 100);
      },
      error: (err) => {
        console.log('Error completo:', err); // Debug para ver la estructura del error
        console.log('Status:', err.status);
        console.log('Error message:', err.error?.message || err.message);

        // Manejo mejorado de errores - Priorizar mensaje específico del backend
        if (err.error?.message) {
          this.toast.error(err.error.message);
        } else if (err.status === 401) {
          this.toast.error('Credenciales incorrectas');
        } else if (err.status === 400) {
          this.toast.error('Datos inválidos');
        } else if (err.status === 0) {
          this.toast.error('Sin conexión al servidor');
        } else {
          this.toast.error('Error de conexión al servidor');
        }
      }
    });
  }
}
