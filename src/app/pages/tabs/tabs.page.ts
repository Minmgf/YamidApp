import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UserData } from '../../guards/auth.guard';

interface TabItem {
  label: string;
  icon: string;
  tab: string;
  href: string;
  visible: (user: UserData | null) => boolean;
}

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false
})
export class TabsPage implements OnInit, OnDestroy {
  user: UserData | null = null;
  tabItems: TabItem[] = [];
  private userSubscription: Subscription = new Subscription();

  constructor(private authService: AuthService) { }

  ngOnInit() {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.updateTabItems();
    });
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  private updateTabItems() {
    this.tabItems = [
      {
        label: 'Inicio',
        icon: 'home-outline',
        tab: 'dashboard',
        href: '/tabs/dashboard',
        visible: (user) => this.authService.hasPermission('dashboard')
      },
      {
        label: 'Municipios',
        icon: 'map-outline',
        tab: 'municipios',
        href: '/tabs/municipios',
        visible: (user) => this.authService.hasPermission('municipios')
      },
      {
        label: 'Agenda',
        icon: 'calendar-outline',
        tab: 'agenda',
        href: '/tabs/agenda',
        visible: (user) => this.authService.hasPermission('agenda')
      },
      {
        label: 'Blog',
        icon: 'newspaper-outline',
        tab: 'blog',
        href: '/tabs/blog',
        visible: (user) => this.authService.hasPermission('blog')
      },
      {
        label: 'Perfil',
        icon: 'person-outline',
        tab: 'welcome',
        href: '/tabs/welcome',
        visible: (user) => this.authService.hasPermission('perfil')
      }
    ];
  }
}
