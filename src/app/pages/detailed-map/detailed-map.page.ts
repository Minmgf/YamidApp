import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { HeatmapService, HeatmapData, HeatmapResponse } from '../../services/heatmap.service';

@Component({
  selector: 'app-detailed-map',
  templateUrl: './detailed-map.page.html',
  styleUrls: ['./detailed-map.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class DetailedMapPage implements AfterViewInit, OnDestroy, OnInit {
  private map!: L.Map;
  heatmapData: HeatmapData[] = [];
  isLoading = true;
  totalUsuarios = 0;

  constructor(
    private router: Router,
    private heatmapService: HeatmapService
  ) {}

  ngOnInit() {
    this.loadHeatmapData();
  }

  ngAfterViewInit() {
    // Inicializar el mapa con una pequeña demora para mejor renderizado
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  goBack() {
    this.router.navigate(['/tabs/dashboard']);
  }

  loadHeatmapData() {
    this.heatmapService.getHeatmapData({ estado: 'todos' }).subscribe({
      next: (response: HeatmapResponse) => {
        console.log('📊 Datos del heatmap cargados:', response);
        if (response.success) {
          this.heatmapData = response.data;
          this.totalUsuarios = response.total_usuarios_sistema;
          this.isLoading = false;

          // Si el mapa ya está inicializado, cargar la visualización del heatmap
          if (this.map) {
            this.loadHeatmapVisualization();
          }
        }
      },
      error: (error) => {
        console.error('❌ Error cargando datos del heatmap:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeMap() {
    // Inicializar el mapa centrado específicamente en Neiva, Huila
    this.map = L.map('detailed-map', {
      center: [2.9273, -75.2819], // Coordenadas exactas de Neiva, Huila
      zoom: 8,  // Zoom más cercano para enfocar mejor el Huila
      zoomControl: true,
      attributionControl: false,
      minZoom: 7,  // Zoom mínimo para no alejarse demasiado
      maxZoom: 16  // Zoom máximo para mantener calidad
    });

    /** Pane para controlar superposición */
    this.map.createPane('croquis');
    this.map.getPane('croquis')!.style.zIndex = '450';

    /** Agregar capas base igual que en dashboard */
    // Mapa satelital de Esri
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      maxZoom: 18
    });

    // Mapa de calles de OpenStreetMap
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // Mapa híbrido (satelital + etiquetas)
    const hybridLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    // Agregar el mapa de calles por defecto
    streetLayer.addTo(this.map);

    // Control de capas para cambiar entre tipos de mapa
    const baseMaps = {
      "🛰️ Satelital": satelliteLayer,
      "🗺️ Calles": streetLayer,
      "🔀 Híbrido": L.layerGroup([satelliteLayer, hybridLabels])
    };

    L.control.layers(baseMaps).addTo(this.map);

    // Cargar el mapa del Huila con límites municipales
    this.loadHuilaMap();

    // Hacer el mapa responsivo
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
  }

  /**
   * Carga el mapa del Huila con municipios delimitados (copiado del dashboard)
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

        // Ajustar vista al departamento del Huila con límites optimizados
        this.map.fitBounds(municipiosLayer.getBounds(), {
          padding: [30, 30],
          maxZoom: 9,  // Mantener un zoom más cercano
          animate: true,
          duration: 1.0
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
   * Carga la visualización del mapa de calor con datos reales (copiado del dashboard)
   */
  private loadHeatmapVisualization(): void {
    if (!this.map || this.heatmapData.length === 0) {
      setTimeout(() => this.loadHeatmapVisualization(), 500);
      return;
    }

    // Mapeo de coordenadas por ID de municipio (igual que dashboard)
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

    // Crear visualización mejorada para cada municipio
    this.heatmapData.forEach((data) => {
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

    console.log(`✅ Heatmap detallado cargado: ${this.heatmapData.length} municipios visualizados`);
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
      interactive: true,
      bubblingMouseEvents: false
    }).addTo(this.map);

    // Efectos hover
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

    // Popup con información detallada
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
      interactive: false,
      bubblingMouseEvents: false
    }).addTo(this.map);
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
      interactive: false,
      keyboard: false,
    }).addTo(this.map);

    // Tooltip con nombre del municipio
    numberMarker.bindTooltip(data.municipio, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      interactive: false
    });
  }

  /**
   * Obtiene color del gradiente para el heatmap
   */
  private getHeatmapGradientColor(intensidad: number): string {
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
   * Crear popup mejorado con información detallada
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

  // Métodos para controles del mapa
  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  resetView() {
    this.map.setView([2.9273, -75.2819], 8); // Volver a vista centrada del Huila
  }

  toggleSatellite() {
    // Implementar cambio entre vista satelital y mapa normal
    // Por ahora solo un placeholder
    console.log('Cambiar vista satelital');
  }
}
