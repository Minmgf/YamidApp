import { Component, OnInit } from '@angular/core';

interface TabItem {
  label: string;
  icon: string;
  tab: string;
  href: string;
  visible: (user: any) => boolean;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false
})
export class TabsPage implements OnInit {
  user: any = null;
  tabItems: TabItem[] = [];

  constructor() { }

  ngOnInit() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.user = JSON.parse(userData);
    }
    this.tabItems = [
      {
        label: 'Inicio',
        icon: 'home-outline',
        tab: 'dashboard',
        href: '/tabs/dashboard',
        visible: (user) => user?.rol === 'super_admin' || user?.permisos?.acceso_completo
      },
      {
        label: 'Municipios',
        icon: 'map-outline',
        tab: 'municipios',
        href: '/tabs/municipios',
        visible: (user) => user?.rol === 'super_admin' || user?.permisos?.acceso_completo
      },
      {
        label: 'Agenda',
        icon: 'calendar-outline',
        tab: 'agenda',
        href: '/tabs/agenda',
        visible: (_) => true
      },
      {
        label: 'Blog',
        icon: 'newspaper-outline',
        tab: 'blog',
        href: '/tabs/blog',
        visible: (_) => true
      },
      {
        label: 'Perfil',
        icon: 'person-outline',
        tab: 'welcome',
        href: '/tabs/welcome',
        visible: (_) => true
      }
    ];
  }
}
