import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';

@Component({
  standalone: true,
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule, // <--- Importante para los componentes ion-*
    MainHeaderComponent
  ]
})
export class WelcomePage implements OnInit {
  user: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.user = JSON.parse(userData);
    } else {
      this.router.navigate(['/login']);
    }
  }

  getPermissionsList(): string[] {
    if (!this.user?.permisos) return [];
    const labels: { [key: string]: string } = {
      puede_registrar_usuarios: 'Registrar usuarios',
      puede_ver_metricas: 'Ver métricas',
      puede_gestionar_roles: 'Gestionar roles',
      acceso_completo: 'Acceso completo'
    };
    return Object.entries(this.user.permisos)
      .filter(([_, v]) => v)
      .map(([k, _]) => labels[k] || k);
  }

  logout() {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    console.log('Token antes de salir:', token);
    console.log('CurrentUser antes de salir:', currentUser);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.user = null; // Limpiar usuario en memoria
    this.router.navigate(['/login'], { replaceUrl: true }); // Evitar volver atrás
  }
}
