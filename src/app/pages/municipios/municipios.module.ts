import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MunicipiosPageRoutingModule } from './municipios-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MunicipiosPageRoutingModule
  ]
})
export class MunicipiosPageModule {}
