import { Component, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private platform: Platform) {}

  async ngOnInit() {
    await this.platform.ready();

    if (this.platform.is('capacitor')) {
      try {
        // Configurar la barra de estado
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: false });

        console.log('StatusBar configurado correctamente');
      } catch (error) {
        console.error('Error al configurar StatusBar:', error);
      }
    }
  }
}
