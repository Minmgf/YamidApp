import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent]
})
export class AgendaPage implements OnInit {
  constructor(private router: Router) { }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  ngOnInit() {}
}
