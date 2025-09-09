import 'maplibre-gl/dist/maplibre-gl.css';
import './css/map.css';
import maplibregl from 'maplibre-gl';
import { App } from './js/app.js';

// --- 1. CREATE THE MAP ---
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            osm: {
                type: 'raster',
                tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap Contributors',
            },
            cartalex: {
                type: 'vector',
                tiles: ['http://localhost:8080/maps/cartalex/{z}/{x}/{y}.pbf'],
                minzoom: 0,
                maxzoom: 22,
            }
        },
        layers: [
            { id: 'osm-background', type: 'raster', source: 'osm' },
            { id: 'parcelles_region-fill', type: 'fill', source: 'cartalex', 'source-layer': 'parcelles_region', paint: { 'fill-color': 'rgba(128, 0, 128, 0.4)' } },
            { id: 'espaces_publics-fill', type: 'fill', source: 'cartalex', 'source-layer': 'espaces_publics', paint: { 'fill-color': 'rgba(128, 0, 128, 0.4)' } },
            { id: 'emprises-fill', type: 'fill', source: 'cartalex', 'source-layer': 'emprises', paint: { 'fill-color': 'rgba(128, 0, 128, 0.4)' } },
            { id: 'noms_rues-line', type: 'line', source: 'cartalex', 'source-layer': 'noms_rues', paint: { 'line-color': 'rgba(255, 165, 0, 0.8)', 'line-width': 2 } },
            { id: 'littoral-line', type: 'line', source: 'cartalex', 'source-layer': 'littoral', paint: { 'line-color': 'rgba(255, 165, 0, 0.8)', 'line-width': 2 } },
            { id: 'sites_fouilles-points', type: 'circle', source: 'cartalex', 'source-layer': 'sites_fouilles', paint: { 'circle-radius': 6, 'circle-color': 'rgba(0, 150, 255, 0.9)', 'circle-stroke-color': 'white', 'circle-stroke-width': 1.5 } }
        ]
    },
    center: [29.9187, 31.2001],
    zoom: 14
});

map.addControl(new maplibregl.NavigationControl());

// --- 2. INITIALIZE THE APPLICATION LOGIC ---
map.on('load', () => {
  const app = new App(map);
  app.initialize();
});