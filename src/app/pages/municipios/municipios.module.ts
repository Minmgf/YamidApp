import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MunicipiosPageRoutingModule } from './municipios-routing.module';

import { MunicipiosPage } from './municipios.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MunicipiosPageRoutingModule
  ],
  declarations: [MunicipiosPage]
})
export class MunicipiosPageModule {}
