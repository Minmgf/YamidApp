import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AutoRedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Redirigir a la ruta por defecto del usuario
    const defaultRoute = this.authService.getDefaultRoute();
    if (defaultRoute !== '/login') {
      this.router.navigate([defaultRoute]);
      return false; // No activar la ruta actual, redirigir
    }

    // Si no tiene acceso a ninguna ruta, ir al login
    this.router.navigate(['/login']);
    return false;
  }
}
