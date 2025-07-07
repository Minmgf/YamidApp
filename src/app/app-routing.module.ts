import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '',      redirectTo: 'splash', pathMatch: 'full' },
  { path: 'splash', loadChildren: () => import('./pages/splash/splash.module').then(m => m.SplashPageModule) },
  { path: 'login',  loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule) },
  { path: 'tabs',   loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule) },
  // ⛔️ NO pongas aquí dashboard/municipios/…
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
