import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'dashboard',   loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardPageModule) },
      { path: 'municipios',  loadChildren: () => import('../municipios/municipios.module').then(m => m.MunicipiosPageModule) },
      { path: 'agenda',      loadChildren: () => import('../agenda/agenda.module').then(m => m.AgendaPageModule) },
      { path: 'blog',        loadChildren: () => import('../blog/blog.module').then(m => m.BlogPageModule) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}