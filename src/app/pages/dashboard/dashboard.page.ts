import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ViewDidEnter, IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { UserCountService } from '../../services/user-count.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent]
})
export class DashboardPage implements AfterViewInit, ViewDidEnter, OnInit {
  userCount: number = 0; // Variable para almacenar el conteo

  private map!: L.Map;

  constructor(
    private router: Router,
    private userCountService: UserCountService, // Inyectar el servicio
  ) {}

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  ngOnInit() {
    this.loadUserCount();
  }

  loadUserCount() {
    this.userCountService.getUserCount().subscribe({
      next: (response) => {
        this.userCount = response.count || response.total || response;
        console.log('User count:', this.userCount);
      },
      error: (error) => {
        console.error('Error loading user count:', error);
        this.userCount = 0; // Valor por defecto en caso de error
      }
    });
  }

  ngAfterViewInit(): void {
    /** 1. Inicializar el mapa */
    this.map = L.map('map', { attributionControl: false });

    // Si quieres habilitar el mapa base, descomenta esto:
    /*
    L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(this.map);
    */

    /** Pane para controlar superposición */
    this.map.createPane('croquis');
    this.map.getPane('croquis')!.style.zIndex = '450';

    /** 2. Dibujar el croquis base */
    fetch('assets/geojson/huila.geojson')
      .then(r => r.json())
      .then((bordes: GeoJSON.FeatureCollection) => {
        const linea = L.geoJSON(bordes, {
          pane: 'croquis',
          style: () => ({
            color: '#000',
            weight: 2.5,
            dashArray: '8 6',
            lineCap: 'round',
            lineJoin: 'round',
            fill: false,
          })
        }).addTo(this.map);

        /** 3. Agregar los municipios con estados de color */
        fetch('assets/geojson/huila-municipios.geojson')
          .then(r => r.json())
          .then((datos: GeoJSON.FeatureCollection) => {
            datos.features.forEach((f: any) => {
              const props = f.properties ?? {};
              const nombre = props['NOMBRE_ENT'];
              const estado = props['estado'];

              if (f.geometry?.type === 'Polygon') {
                const coords: number[][] = f.geometry.coordinates[0];
                const lats = coords.map(c => c[1]);
                const lngs = coords.map(c => c[0]);
                const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
                const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
                const color = this.getColor(estado);

                // Puntos coloreados
                L.circleMarker([lat, lng], {
                  radius: 10,
                  color,
                  weight: 2,
                  fillColor: color,
                  fillOpacity: 0.7
                }).addTo(this.map);

                // Etiquetas de municipios
                L.marker([lat, lng], {
                  icon: L.divIcon({
                    className: 'label-municipio',
                    html: `<div style="font-size:11px;text-align:center">${nombre}</div>`,
                    iconSize: [100, 20]
                  })
                }).addTo(this.map);
              }
            });

            /** 4. Ajustar vista completa */
            this.map.fitBounds(linea.getBounds(), {
              padding: [40, 40],
              maxZoom: 14,
            });
          });
      });

    /** 5. Cargar gráfica blog */
    const ctx = (document.getElementById('blogChart') as HTMLCanvasElement)?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Semana pasada', 'Esta semana'],
          datasets: [{
            label: 'Artículos',
            data: [5, 7],
            backgroundColor: ['#ccc', '#cbd501'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }
    /** 6. Gráfica de líderes */
    const liderCtx = (document.getElementById('liderChart') as HTMLCanvasElement)?.getContext('2d');
    if (liderCtx) {
      new Chart(liderCtx, {
        type: 'bar',
        data: {
          labels: ['Semana pasada', 'Esta semana'],
          datasets: [{
            label: 'Líderes',
            data: [8, 14],
            backgroundColor: ['#ccc', '#28a745'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }



  }

  ionViewDidEnter() {
    this.map?.invalidateSize();
  }

  private getColor(estado = '') {
    return { rojo: '#ff4d4d', amarillo: '#ffeb3b', verde: '#35c84a' }[estado] ?? '#333';
  }
}
