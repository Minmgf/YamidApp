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
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async submit() {
    if (this.form.invalid) {
      this.toast.warning('Complete todos los campos correctamente');
      return;
    }

    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        // Navegar a la ruta por defecto
        const defaultRoute = this.authService.getDefaultRoute();
        this.toast.success('¡Bienvenido!');
        this.navCtrl.navigateRoot(defaultRoute);
      },
      error: (err) => {
        console.log('Error completo:', err); // Debug para ver la estructura del error
        console.log('Status:', err.status);
        console.log('Error message:', err.error?.message || err.message);

        // Manejo mejorado de errores
        if (err.status === 401) {
          this.toast.error('Credenciales incorrectas');
        } else if (err.status === 400) {
          this.toast.error('Datos inválidos');
        } else if (err.status === 0) {
          this.toast.error('Sin conexión al servidor');
        } else if (err.error?.message) {
          this.toast.error(`${err.error.message}`);
        } else {
          this.toast.error('Error de conexión al servidor');
        }
      }
    });
  }
}
