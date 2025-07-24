import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { RoleGuard } from '../../guards/role.guard';
import { AutoRedirectGuard } from '../../guards/auto-redirect.guard';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardPageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin'],
          permission: 'dashboard',
          title: 'Dashboard'
        }
      },
      {
        path: 'municipios',
        loadChildren: () => import('../municipios/municipios.module').then(m => m.MunicipiosPageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin'],
          permission: 'municipios',
          title: 'Municipios'
        }
      },
      {
        path: 'agenda',
        loadChildren: () => import('../agenda/agenda.module').then(m => m.AgendaPageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin', 'admin', 'user', 'simpatizante'],
          permission: 'agenda',
          title: 'Agenda'
        }
      },
      {
        path: 'blog',
        loadChildren: () => import('../blog/blog.module').then(m => m.BlogPageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin', 'admin', 'user', 'simpatizante'],
          permission: 'blog',
          title: 'Blog'
        }
      },
      {
        path: 'welcome',
        loadChildren: () => import('../welcome/welcome.module').then(m => m.WelcomePageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin', 'admin', 'user', 'simpatizante'],
          permission: 'perfil',
          title: 'Perfil'
        }
      },
      {
        path: 'usuarios',
        loadChildren: () => import('../usuarios/usuarios.module').then(m => m.UsuariosPageModule),
        canActivate: [RoleGuard],
        data: {
          roles: ['super_admin'],
          permission: 'usuarios',
          title: 'Usuarios'
        }
      },
      {
        path: '',
        canActivate: [AutoRedirectGuard],
        children: []
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
