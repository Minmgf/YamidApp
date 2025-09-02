import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ViewDidEnter, IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { MainHeaderComponent } from '../../shared/main-header/main-header.component';
import { UserCountService } from '../../services/user-count.service';
import { HeatmapService, HeatmapData } from '../../services/heatmap.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, MainHeaderComponent]
})
export class DashboardPage implements AfterViewInit, ViewDidEnter, OnInit {
  userCount: number = 0; // Variable para almacenar el conteo
  heatmapData: HeatmapData[] = [];
  totalUsuariosSistema: number = 0;

  private map!: L.Map;

  constructor(
    private router: Router,
    private userCountService: UserCountService,
    private heatmapService: HeatmapService
  ) {}

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  openDetailedMap() {
    this.router.navigate(['/tabs/detailed-map']);
  }

  ngOnInit() {
    this.loadUserCount();
    this.loadHeatmapData();
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

  loadHeatmapData() {
    this.heatmapService.getHeatmapData({ estado: 'todos' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.heatmapData = response.data;
          this.totalUsuariosSistema = response.total_usuarios_sistema;
          console.log('Heatmap data loaded:', this.heatmapData);
        }
      },
      error: (error) => {
        console.error('Error loading heatmap data:', error);
        this.heatmapData = [];
      }
    });
  }

  ngAfterViewInit(): void {
    /** 1. Inicializar el mapa */
    this.map = L.map('map', { attributionControl: false });

    /** Pane para controlar superposición */
    this.map.createPane('croquis');
    this.map.getPane('croquis')!.style.zIndex = '450';

    /** 2. Agregar tile layer (mapa base) */
    // Opción 1: Mapa satelital de Esri
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 18
    });

    // Opción 2: Mapa de calles de OpenStreetMap
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // Opción 3: Mapa híbrido (satelital + etiquetas)
    const hybridLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    // Agregar el mapa satelital por defecto
    streetLayer.addTo(this.map);

    // Control de capas para cambiar entre tipos de mapa
    const baseMaps = {
      "Satelital": satelliteLayer,
      "Calles": streetLayer,
      "Híbrido": L.layerGroup([satelliteLayer, hybridLabels])
    };

    L.control.layers(baseMaps).addTo(this.map);

    /** 3. Dibujar el mapa del Huila */
    this.map.setView([2.9273, -75.2819], 9); // Centrar en Neiva, Huila

    // Cargar el mapa base del Huila
    this.loadHuilaMap();

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

  /**
   * Carga el mapa del Huila con municipios delimitados
   */
  private loadHuilaMap(): void {
    console.log('🗺️ Cargando mapa del Huila con límites municipales...');

    // Cargar el GeoJSON corregido de municipios del Huila
    fetch('assets/geojson/huila-fixed.geojson')
      .then(r => r.json())
      .then((datos: GeoJSON.FeatureCollection) => {
        console.log('✅ GeoJSON del Huila cargado:', datos.features.length, 'municipios');

        // Crear capa de municipios con bordes delimitados
        const municipiosLayer = L.geoJSON(datos, {
          style: (feature) => ({
            color: '#ffffff',        // Bordes blancos para destacar sobre satelital
            weight: 2,               // Grosor más visible
            opacity: 1,              // Opacidad completa para los bordes
            fill: true,
            fillColor: '#3498db',    // Relleno azul claro
            fillOpacity: 0.2,        // Transparencia para ver el satelital debajo
            dashArray: '5, 5'        // Línea punteada para mejor visibilidad
          }),
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              const props = feature.properties;

              // Popup con información del municipio
              const popupContent = `
                <div class="municipio-info-popup">
                  <h4>🏛️ ${props.municipio}</h4>
                  <div class="municipio-details">
                    <div><strong>ID:</strong> ${props.municipio_id}</div>
                    <div><strong>Código DANE:</strong> ${props.codigo_dane}</div>
                    <div><strong>Departamento:</strong> ${props.departamento}</div>
                  </div>
                </div>
              `;
              layer.bindPopup(popupContent);

              // Efecto hover para resaltar municipio
              layer.on('mouseover', (e: any) => {
                e.target.setStyle({
                  fillOpacity: 0.5,        // Mayor opacidad al hacer hover
                  weight: 3,               // Borde más grueso
                  color: '#f39c12',        // Color naranja para destacar
                  fillColor: '#e74c3c',    // Relleno rojo para resaltar
                  dashArray: ''            // Quitar línea punteada en hover
                });
              });

              layer.on('mouseout', (e: any) => {
                e.target.setStyle({
                  fillOpacity: 0.2,        // Volver a la transparencia original
                  weight: 2,               // Grosor original
                  color: '#ffffff',        // Color blanco original
                  fillColor: '#3498db',    // Relleno azul original
                  dashArray: '5, 5'        // Volver a línea punteada
                });
              });
            }
          }
        }).addTo(this.map);

        // Ajustar vista al departamento completo
        this.map.fitBounds(municipiosLayer.getBounds(), {
          padding: [20, 20],
          maxZoom: 10,
        });

        console.log('✅ Mapa del Huila cargado correctamente con límites municipales');

        // Cargar datos de calor superpuestos
        this.loadHeatmapVisualization();
      })
      .catch(error => {
        console.error('❌ Error cargando GeoJSON del Huila:', error);
        // Fallback: solo cargar datos de calor
        this.loadHeatmapVisualization();
      });
  }

  /**
   * Carga la visualización del mapa de calor con datos reales - VERSIÓN MEJORADA
   */
  private loadHeatmapVisualization(): void {
    if (!this.map || this.heatmapData.length === 0) {
      setTimeout(() => this.loadHeatmapVisualization(), 500);
      return;
    }

    // Mapeo de coordenadas por ID de municipio
    const coordenadasPorId: { [key: number]: [number, number] } = {
      1: [2.9273, -75.2819], 2: [1.8000, -75.8833], 3: [2.4167, -75.6833], 4: [3.2167, -75.2333],
      5: [2.5167, -75.3167], 6: [2.0667, -75.7833], 7: [3.1500, -75.0500], 8: [2.6833, -75.3333],
      9: [3.3667, -74.8000], 10: [2.0167, -75.9333], 11: [2.2000, -75.6333], 12: [2.3833, -75.5500],
      13: [2.0167, -75.7500], 14: [2.5833, -75.4500], 15: [2.6500, -75.6333], 16: [1.9333, -76.2333],
      17: [2.2000, -75.9833], 18: [2.3833, -75.8833], 19: [2.5500, -75.8167], 20: [2.0167, -75.9833],
      21: [2.4500, -75.7833], 22: [2.8833, -75.4333], 23: [2.6167, -75.6167], 24: [2.2667, -75.8000],
      25: [1.8500, -76.1000], 26: [2.7833, -75.2667], 27: [1.8833, -76.0500], 28: [1.8833, -76.2667],
      29: [2.9333, -75.5833], 30: [1.9667, -75.7833], 31: [2.1000, -75.8167], 32: [2.4833, -75.7167],
      33: [3.0667, -75.1333], 34: [2.7333, -75.5667], 35: [1.9667, -75.9333], 36: [3.2167, -75.2167],
      37: [2.6667, -75.4333]
    };

    // Calcular estadísticas para normalización
    const maxUsuarios = Math.max(...this.heatmapData.map(d => d.total_usuarios));
    const minUsuarios = Math.min(...this.heatmapData.map(d => d.total_usuarios));
    const avgUsuarios = this.heatmapData.reduce((sum, d) => sum + d.total_usuarios, 0) / this.heatmapData.length;

    // Crear leyenda del heatmap
    this.createHeatmapLegend(minUsuarios, maxUsuarios, avgUsuarios);

    // Ya no necesitamos listener del mapa para badges

    // Crear visualización mejorada para cada municipio
    this.heatmapData.forEach((data, index) => {
      const coordenadas = coordenadasPorId[data.municipio_id] || [2.9273, -75.2819];

      // Calcular intensidad normalizada (0-1)
      const intensidad = maxUsuarios > minUsuarios ?
        (data.total_usuarios - minUsuarios) / (maxUsuarios - minUsuarios) : 0.5;

      // Crear múltiples capas para efecto de glow
      this.createGlowEffect(coordenadas, intensidad, data);

      // Crear círculo principal con gradiente
      this.createMainHeatmapCircle(coordenadas, intensidad, data);

      // Agregar animación de pulso para valores altos
      if (intensidad > 0.7) {
        this.createPulseEffect(coordenadas, data);
      }

      // Crear número en el centro del círculo
      this.createCenterNumber(coordenadas, data);
    });

    console.log(`✅ Heatmap mejorado cargado: ${this.heatmapData.length} municipios visualizados`);
  }

  /**
   * Crear efecto de resplandor (glow) para el heatmap
   */
  private createGlowEffect(coordenadas: [number, number], intensidad: number, data: any): void {
    const baseRadius = 12 + (intensidad * 20);

    // Crear múltiples círculos concéntricos para efecto glow
    for (let i = 3; i >= 1; i--) {
      const glowRadius = baseRadius + (i * 8);
      const glowOpacity = (0.15 / i) * intensidad;

      L.circleMarker(coordenadas, {
        radius: glowRadius,
        color: 'transparent',
        fillColor: this.getHeatmapGradientColor(intensidad),
        fillOpacity: glowOpacity,
        className: `heatmap-glow-${i}`,
        pane: 'overlayPane'
      }).addTo(this.map);
    }
  }

  /**
   * Crear círculo principal del heatmap con gradiente
   */
  private createMainHeatmapCircle(coordenadas: [number, number], intensidad: number, data: any): void {
    const radius = 12 + (intensidad * 15);
    const colors = this.getHeatmapGradientColors(intensidad);

    const mainCircle = L.circleMarker(coordenadas, {
      radius: radius,
      color: colors.border,
      weight: 2,
      fillColor: colors.fill,
      fillOpacity: 0.8,
      className: 'heatmap-main-circle',
      interactive: true,  // Asegurar que sea interactivo
      bubblingMouseEvents: false  // Evitar que los eventos se propaguen
    }).addTo(this.map);

    // Efectos hover simples
    mainCircle.on('mouseover', () => {
      mainCircle.setStyle({
        radius: radius + 3,
        weight: 3,
        fillOpacity: 0.9
      });
    });

    mainCircle.on('mouseout', () => {
      mainCircle.setStyle({
        radius: radius,
        weight: 2,
        fillOpacity: 0.8
      });
    });

    // Popup opcional con información detallada
    const popupContent = this.createEnhancedPopup(data, intensidad);
    mainCircle.bindPopup(popupContent);
  }

  /**
   * Crear efecto de pulso para valores altos
   */
  private createPulseEffect(coordenadas: [number, number], data: any): void {
    const pulseCircle = L.circleMarker(coordenadas, {
      radius: 25,
      color: '#ff4444',
      weight: 2,
      fillColor: 'transparent',
      className: 'heatmap-pulse',
      interactive: false,  // CRÍTICO: No debe capturar eventos
      bubblingMouseEvents: false  // Evitar propagación de eventos
    }).addTo(this.map);

    // Animación CSS será manejada por las clases
  }

  /**
   * Crear número en el centro del círculo del heatmap
   */
  private createCenterNumber(coordenadas: [number, number], data: any): void {
    const numberMarker = L.marker(coordenadas, {
      icon: L.divIcon({
        className: 'heatmap-center-number',
        html: `<div class="center-number">${data.total_usuarios}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      }),
      interactive: false,  // El número no debe ser interactivo
      keyboard: false,     // No responder a eventos de teclado
    }).addTo(this.map);

    // Opcional: agregar tooltip con nombre del municipio
    numberMarker.bindTooltip(data.municipio, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      interactive: false  // El tooltip tampoco debe interferir
    });
  }

  // Funciones de badges clickeables eliminadas - ahora usamos números centrados

  /**
   * Crear leyenda interactiva del heatmap
   */
  private createHeatmapLegend(min: number, max: number, avg: number): void {
    const legend = new (L.Control.extend({
      options: {
        position: 'bottomright'
      },

      onAdd: function(map: any) {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
          <div class="legend-container">
            <h4>Usuarios por municipio</h4>
          </div>
        `;
        return div;
      }
    }))();

    legend.addTo(this.map);
  }

  /**
   * Obtiene color gradiente para el heatmap mejorado
   */
  private getHeatmapGradientColor(intensidad: number): string {
    // Gradiente suave de verde a rojo pasando por amarillo/naranja
    if (intensidad >= 0.8) return '#FF1744'; // Rojo intenso
    if (intensidad >= 0.6) return '#FF6D00'; // Naranja intenso
    if (intensidad >= 0.4) return '#FFD600'; // Amarillo
    if (intensidad >= 0.2) return '#76FF03'; // Verde claro
    return '#00E676'; // Verde intenso
  }

  /**
   * Obtiene colores de borde y relleno para círculos principales
   */
  private getHeatmapGradientColors(intensidad: number): {border: string, fill: string} {
    if (intensidad >= 0.8) return {
      border: '#D32F2F',
      fill: 'rgba(244, 67, 54, 0.7)'
    };
    if (intensidad >= 0.6) return {
      border: '#F57C00',
      fill: 'rgba(255, 152, 0, 0.7)'
    };
    if (intensidad >= 0.4) return {
      border: '#FBC02D',
      fill: 'rgba(255, 235, 59, 0.7)'
    };
    if (intensidad >= 0.2) return {
      border: '#689F38',
      fill: 'rgba(139, 195, 74, 0.7)'
    };
    return {
      border: '#388E3C',
      fill: 'rgba(76, 175, 80, 0.7)'
    };
  }

  /**
   * Obtiene colores para badges informativos
   */
  private getBadgeColor(intensidad: number): {bg: string, text: string, border: string} {
    if (intensidad >= 0.7) return {
      bg: 'linear-gradient(135deg, #FF5722, #D32F2F)',
      text: '#FFFFFF',
      border: '#FF5722'
    };
    if (intensidad >= 0.4) return {
      bg: 'linear-gradient(135deg, #FF9800, #F57C00)',
      text: '#FFFFFF',
      border: '#FF9800'
    };
    return {
      bg: 'linear-gradient(135deg, #4CAF50, #388E3C)',
      text: '#FFFFFF',
      border: '#4CAF50'
    };
  }

  /**
   * Crear popup mejorado con mejor diseño usando Flexbox e Ionicons
   */
  private createEnhancedPopup(data: any, intensidad: number): string {
    const intensityLabel = intensidad >= 0.7 ? 'Alta' : intensidad >= 0.4 ? 'Media' : 'Baja';
    const intensityColor = intensidad >= 0.7 ? '#FF5722' : intensidad >= 0.4 ? '#FF9800' : '#4CAF50';

    return `
      <div class="enhanced-heatmap-popup">
        <div class="popup-header">
          <div class="header-info">
            <h3>${data.municipio}</h3>
            <span class="density-badge" style="background: ${intensityColor};">Densidad ${intensityLabel}</span>
          </div>
        </div>

        <div class="popup-stats">
          <div class="stat-row">
            <ion-icon name="people-outline" class="stat-icon"></ion-icon>
            <span class="stat-value">${data.total_usuarios}</span>
            <span class="stat-label">Total</span>
          </div>

          <div class="stat-row">
            <ion-icon name="checkmark-circle-outline" class="stat-icon active"></ion-icon>
            <span class="stat-value">${data.usuarios_activos}</span>
            <span class="stat-label">Activos</span>
          </div>

          <div class="stat-row">
            <ion-icon name="pause-circle-outline" class="stat-icon inactive"></ion-icon>
            <span class="stat-value">${data.usuarios_inactivos}</span>
            <span class="stat-label">Inactivos</span>
          </div>

          <div class="stat-row progress-row">
            <ion-icon name="bar-chart-outline" class="stat-icon"></ion-icon>
            <div class="progress-mini">
              <div class="progress-fill-mini" style="width: ${data.porcentaje_activos}%; background: ${intensityColor};"></div>
            </div>
            <span class="stat-value">${Math.round(data.porcentaje_activos)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Funciones legacy mantenidas para compatibilidad
   */
  private getHeatmapColor(intensidad: number): string {
    return this.getHeatmapGradientColor(intensidad);
  }

  private getHeatmapFillColor(intensidad: number): string {
    const colors = this.getHeatmapGradientColors(intensidad);
    return colors.fill;
  }

  /**
   * Función legacy para compatibilidad
   */
  private getColor(estado = '') {
    return { rojo: '#ff4d4d', amarillo: '#ffeb3b', verde: '#35c84a' }[estado] ?? '#333';
  }
}
