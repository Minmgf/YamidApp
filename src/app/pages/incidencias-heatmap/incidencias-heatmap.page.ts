import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface IncidenciaData {
  id: number;
  titulo: string;
  categoria: string;
  descripcion: string;
  ciudad_id: number;
  ciudad_nombre: string;
  usuario_id: number;
  usuario_nombre: string;
  fecha_creacion: string;
  estado: string;
}

interface IncidenciasResponse {
  success: boolean;
  data: IncidenciaData[];
  total: number;
  page: number;
  limit: number;
}

interface IncidenciasByMunicipio {
  municipio_id: number;
  municipio: string;
  total_incidencias: number;
  incidencias_pendientes: number;
  incidencias_publicadas: number;
  incidencias_rechazadas: number;
  incidencias_por_categoria: {
    social: number;
    seguridad: number;
    ambiental: number;
    salud: number;
    otros: number;
  };
}

interface FiltersType {
  categoria: string;
  estado: string;
}

interface CategoryStat {
  categoria: string;
  count: number;
}

@Component({
  selector: 'app-incidencias-heatmap',
  templateUrl: './incidencias-heatmap.page.html',
  styleUrls: ['./incidencias-heatmap.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class IncidenciasHeatmapPage implements AfterViewInit, OnDestroy, OnInit {
  private map!: L.Map;
  incidenciasData: IncidenciasByMunicipio[] = [];
  allIncidenciasData: IncidenciaData[] = [];
  isLoading = true;
  totalIncidencias = 0;
  showFilters = false;
  showLegend = false;

  filters: FiltersType = {
    categoria: '',
    estado: ''
  };

  categoryStats: CategoryStat[] = [];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadIncidenciasData();
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

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleLegend() {
    this.showLegend = !this.showLegend;
  }

  closeLegend() {
    this.showLegend = false;
  }

  loadIncidenciasData() {
    // Construir parámetros de consulta
    let params: any = {
      limit: 1000, // Obtener todas las incidencias
      page: 1
    };

    // Agregar filtros si están activos
    if (this.filters.categoria) {
      params.categoria = this.filters.categoria;
    }
    if (this.filters.estado) {
      params.estado = this.filters.estado;
    }

    const queryString = new URLSearchParams(params).toString();
    const url = `${environment.apiUrl}/incidencias?${queryString}`;

    this.http.get<IncidenciasResponse>(url).subscribe({
      next: (response: IncidenciasResponse) => {
        console.log('📊 Datos de incidencias cargados:', response);
        if (response.success) {
          this.allIncidenciasData = response.data;
          this.totalIncidencias = response.total;
          this.processIncidenciasData();
          this.calculateCategoryStats();
          this.isLoading = false;

          // Si el mapa ya está inicializado, cargar la visualización
          if (this.map) {
            this.loadHeatmapVisualization();
          }
        }
      },
      error: (error) => {
        console.error('❌ Error cargando datos de incidencias:', error);
        this.isLoading = false;
      }
    });
  }

  private processIncidenciasData() {
    // Agrupar incidencias por municipio
    const municipiosMap = new Map<number, IncidenciasByMunicipio>();

    this.allIncidenciasData.forEach(incidencia => {
      const municipioId = incidencia.ciudad_id;

      if (!municipiosMap.has(municipioId)) {
        municipiosMap.set(municipioId, {
          municipio_id: municipioId,
          municipio: incidencia.ciudad_nombre,
          total_incidencias: 0,
          incidencias_pendientes: 0,
          incidencias_publicadas: 0,
          incidencias_rechazadas: 0,
          incidencias_por_categoria: {
            social: 0,
            seguridad: 0,
            ambiental: 0,
            salud: 0,
            otros: 0
          }
        });
      }

      const municipioData = municipiosMap.get(municipioId)!;
      municipioData.total_incidencias++;

      // Contabilizar por estado
      if (incidencia.estado === 'pendiente') {
        municipioData.incidencias_pendientes++;
      } else if (incidencia.estado === 'publicada') {
        municipioData.incidencias_publicadas++;
      } else if (incidencia.estado === 'rechazada') {
        municipioData.incidencias_rechazadas++;
      }

      // Contabilizar por categoría
      if (municipioData.incidencias_por_categoria.hasOwnProperty(incidencia.categoria)) {
        municipioData.incidencias_por_categoria[incidencia.categoria as keyof typeof municipioData.incidencias_por_categoria]++;
      }
    });

    this.incidenciasData = Array.from(municipiosMap.values());
  }

  private calculateCategoryStats() {
    const categoryMap = new Map<string, number>();

    this.allIncidenciasData.forEach(incidencia => {
      const categoria = incidencia.categoria;
      categoryMap.set(categoria, (categoryMap.get(categoria) || 0) + 1);
    });

    this.categoryStats = Array.from(categoryMap.entries()).map(([categoria, count]) => ({
      categoria,
      count
    })).sort((a, b) => b.count - a.count);
  }

  applyFilters() {
    this.isLoading = true;
    this.clearMapLayers();
    this.loadIncidenciasData();
  }

  clearFilters() {
    this.filters = {
      categoria: '',
      estado: ''
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.categoria || this.filters.estado);
  }

  getCategoriaLabel(categoria: string): string {
    const labels: { [key: string]: string } = {
      'infraestructura': 'Infraestructura',
      'servicios_publicos': 'Servicios Públicos',
      'seguridad': 'Seguridad',
      'medio_ambiente': 'Medio Ambiente',
      'transporte': 'Transporte',
      'salud': 'Salud',
      'ambiental': 'Ambiental',
      'otros': 'Otros'
    };
    return labels[categoria] || 'Otros';
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'publicada': 'Publicada',
      'rechazada': 'Rechazada'
    };
    return labels[estado] || estado;
  }

  getCategoryIcon(categoria: string): string {
    const icons: { [key: string]: string } = {
      'social': 'people',
      'seguridad': 'shield',
      'ambiental': 'leaf',
      'salud': 'medical',
      'educacion': 'school',
      'transporte': 'car',
      'vivienda': 'home',
      'otros': 'ellipsis-horizontal'
    };
    return icons[categoria] || 'help';
  }

  private clearMapLayers() {
    if (this.map) {
      this.map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });
    }
  }

  private initializeMap() {
    // Inicializar el mapa centrado específicamente en Neiva, Huila
    this.map = L.map('incidencias-map', {
      center: [2.9273, -75.2819], // Coordenadas exactas de Neiva, Huila
      zoom: 8,  // Zoom más cercano para enfocar mejor el Huila
      zoomControl: false,
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

    // Cargar el mapa del Huila con límites municipales
    this.loadHuilaMap();

    // Hacer el mapa responsivo
    setTimeout(() => {
      this.map.invalidateSize();
    }, 100);
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
   * Carga la visualización del mapa de calor con datos de incidencias
   */
  private loadHeatmapVisualization(): void {
    if (!this.map || this.incidenciasData.length === 0) {
      setTimeout(() => this.loadHeatmapVisualization(), 500);
      return;
    }

    // Mapeo de coordenadas por ID de municipio (igual que dashboard)
    const coordenadasPorId: { [key: number]: [number, number] } = {
      1: [2.9342176864059044, -75.2809120516755], 2: [1.8051011976000793, -75.88969179256021], 3: [2.2596690023095336, -75.77201528148835], 4:[3.2224037822836413, -75.23707438612577],
      5: [2.523221176724979, -75.31561267846055], 6: [2.0639571653007085, -75.78710852929741], 7: [3.152015605212019, -75.05526510157806], 8: [2.6848532937857708, -75.3250311047461],
      9: [3.376806819733095, -74.80275084423351], 10: [2.0137472878289, -75.93992471259988], 11: [2.197557817535256, -75.62935533391476], 12: [2.381257952102255, -75.54907616880458],
      13: [2.023974071979222, -75.7568741063892], 14: [2.584279433545576, -75.45183125317061], 15: [2.6494090642162234, -75.63546779025941], 16: [1.9302726059409736, -76.21517253771985],
      17: [2.198550650524688, -75.97953194616365], 18: [2.389053941052161, -75.89092062343626], 19: [2.5450278538430373, -75.8088806212259], 20: [2.024937212672603, -75.99460905622094],
      21: [2.4493126467097213, -75.77397469633821], 22: [2.888658857296718, -75.43478065345764], 23: [1.7238656109337673, -76.13379235141304], 24: [2.2671726195674426, -75.80376591792776],
      25: [1.8563233315332122, -76.04613678182471], 26: [2.7779503812965016, -75.25753057594031], 27: [1.9915686069197125, -76.04543048051937], 28: [1.882404244189735, -76.27315747780969],
      29: [2.9376192322492187, -75.58661962561581], 30: [1.9774131786192852, -75.79472529859227], 31: [2.113916527144062, -75.82522926495173], 32: [2.4873778076003057, -75.73025765066576],
      33: [3.0679932979549887, -75.13791232250433], 34: [2.741395608516078, -75.56833083652862], 35: [1.9726873092733845, -75.93209728794793], 36: [3.219633614616072, -75.21888720322812],
      37: [2.664409180971756, -75.51836619189542]
    };

    // Calcular estadísticas para normalización
    const maxIncidencias = Math.max(...this.incidenciasData.map(d => d.total_incidencias));
    const minIncidencias = Math.min(...this.incidenciasData.map(d => d.total_incidencias));

    // Crear visualización mejorada para cada municipio
    this.incidenciasData.forEach((data) => {
      const coordenadas = coordenadasPorId[data.municipio_id] || [2.9273, -75.2819];

      // Calcular intensidad normalizada (0-1)
      const intensidad = maxIncidencias > minIncidencias ?
        (data.total_incidencias - minIncidencias) / (maxIncidencias - minIncidencias) : 0.5;

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

    console.log(`✅ Heatmap de incidencias cargado: ${this.incidenciasData.length} municipios visualizados`);
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
        html: `<div class="center-number">${data.total_incidencias}</div>`,
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
   * Crear popup mejorado con información detallada de incidencias
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
            <ion-icon name="warning-outline" class="stat-icon"></ion-icon>
            <span class="stat-value">${data.total_incidencias}</span>
            <span class="stat-label">Total</span>
          </div>

          <div class="stat-row">
            <ion-icon name="time-outline" class="stat-icon pending"></ion-icon>
            <span class="stat-value">${data.incidencias_pendientes}</span>
            <span class="stat-label">Pendientes</span>
          </div>

          <div class="stat-row">
            <ion-icon name="checkmark-circle-outline" class="stat-icon published"></ion-icon>
            <span class="stat-value">${data.incidencias_publicadas}</span>
            <span class="stat-label">Publicadas</span>
          </div>

          <div class="stat-row">
            <ion-icon name="close-circle-outline" class="stat-icon rejected"></ion-icon>
            <span class="stat-value">${data.incidencias_rechazadas}</span>
            <span class="stat-label">Rechazadas</span>
          </div>

          <div class="categories-section">
            <h4>Por categoría:</h4>
            <div class="category-list">
              <div class="category-item">
                <ion-icon name="people" class="category-icon"></ion-icon>
                <span>${data.incidencias_por_categoria.social || 0} Social</span>
              </div>
              <div class="category-item">
                <ion-icon name="shield" class="category-icon"></ion-icon>
                <span>${data.incidencias_por_categoria.seguridad || 0} Seguridad</span>
              </div>
              <div class="category-item">
                <ion-icon name="leaf" class="category-icon"></ion-icon>
                <span>${data.incidencias_por_categoria.ambiental || 0} Ambiental</span>
              </div>
              <div class="category-item">
                <ion-icon name="medical" class="category-icon"></ion-icon>
                <span>${data.incidencias_por_categoria.salud || 0} Salud</span>
              </div>
              <div class="category-item">
                <ion-icon name="ellipsis-horizontal" class="category-icon"></ion-icon>
                <span>${data.incidencias_por_categoria.otros || 0} Otros</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Métodos para controles del mapa
  resetView() {
    this.map.setView([2.9273, -75.2819], 8); // Volver a vista centrada del Huila
  }
}
