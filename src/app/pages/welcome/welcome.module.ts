import { NgModule } from '@angular/core';
import { WelcomePageRoutingModule } from './welcome-routing.module';
import { WelcomePage } from './welcome.page';

@NgModule({
  imports: [
    WelcomePageRoutingModule,
    WelcomePage // Importa el componente standalone aquí
  ]
})
export class WelcomePageModule {}
