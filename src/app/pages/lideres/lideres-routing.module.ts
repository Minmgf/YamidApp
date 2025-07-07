import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LideresPage } from './lideres.page';

const routes: Routes = [
  {
    path: '',
    component: LideresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LideresPageRoutingModule {}
