const fs = require('fs');

const input = 'src/assets/geojson/huila-bordes-fix.json'; // o municipios.geojson
const output = 'src/assets/geojson/huila-bordes-nuevo.geojson';

const geojson = JSON.parse(fs.readFileSync(input, 'utf8'));

// Verifica nombre de campo correcto (usa 'DPTO' o 'dpt')
const featuresHuila = geojson.features.filter(
  f => f.properties.DPTO === 41 || f.properties.dpt === 'HUILA'
);

function reverseCoords(coords) {
  if (typeof coords[0] === 'number') return [coords[1], coords[0]];
  return coords.map(reverseCoords);
}

featuresHuila.forEach(f => {
  f.geometry.coordinates = reverseCoords(f.geometry.coordinates);
});

const huilaGeoJSON = {
  type: 'FeatureCollection',
  features: featuresHuila
};

fs.writeFileSync(output, JSON.stringify(huilaGeoJSON, null, 2));
console.log('✅ ¡Archivo huila-bordes.geojson generado correctamente!');
