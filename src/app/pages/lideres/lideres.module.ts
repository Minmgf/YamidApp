import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LideresPageRoutingModule } from './lideres-routing.module';

import { LideresPage } from './lideres.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LideresPageRoutingModule
  ],
  declarations: [LideresPage]
})
export class LideresPageModule {}
