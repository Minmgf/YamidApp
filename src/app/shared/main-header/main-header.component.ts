import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class MainHeaderComponent {
  @Input() nombre: string = '';
  @Input() avatar: string = 'assets/img/foto.png';
  @Output() logout = new EventEmitter<void>();
}
