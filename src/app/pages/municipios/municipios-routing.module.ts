import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MunicipiosPage } from './municipios.page';

const routes: Routes = [
  {
    path: '',
    component: MunicipiosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MunicipiosPageRoutingModule {}
