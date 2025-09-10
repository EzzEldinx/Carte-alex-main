import maplibregl from 'maplibre-gl';
import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, buildLayerList, attachAllEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    this.filterCollection = null;
    this.popup = null;
  }

  async initialize() {
    console.log('Initializing application...');
    await this.initFilters();
    this.initLayerList();
    this.initEventListeners();

    // ** START: NEW POPUP LOGIC **
    this.initMapClickListener();
    // ** END: NEW POPUP LOGIC **
  }

  async initFilters() {
    const layerName = 'sitesFouilles';
    this.filterCollection = new FilterCollection(layerName, filters_config[layerName], server_config.api_at);
    await this.filterCollection.initFilters();
    buildFilterUI(this.filterCollection.getFilters());
  }

  initLayerList() {
    const cartalexLayers = this.map.getStyle().layers.filter(layer => layer.source === 'cartalex');
    buildLayerList(cartalexLayers);
  }

  initEventListeners() {
    attachAllEventListeners(
      this.filterCollection.getFilters(),
      async () => { await this.updateMapFilter(); },
      (layerId, isVisible) => { this.toggleLayerVisibility(layerId, isVisible); }
    );
  }

  // ** START: NEW METHODS FOR POPUP **
  initMapClickListener() {
    this.map.on('click', 'sites_fouilles-points', (e) => {
      // If a popup already exists, remove it
      if (this.popup) {
        this.popup.remove();
      }
      
      const feature = e.features[0];
      const coordinates = feature.geometry.coordinates.slice();
      const fid = feature.id; // The 'id' here is the 'fid' from the vector tile

      // Ensure the popup appears over the point
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      
      this.showPopupForSite(fid, coordinates);
    });

    // Change the cursor to a pointer when the mouse is over the points layer.
    this.map.on('mouseenter', 'sites_fouilles-points', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    this.map.on('mouseleave', 'sites_fouilles-points', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  async showPopupForSite(fid, coordinates) {
    // Fetch the detailed data from our new API endpoint
    const response = await fetch(`${server_config.api_at}/sitesFouilles/${fid}/details`);
    if (!response.ok) {
        console.error("Failed to fetch site details");
        return;
    }
    const data = await response.json();

    // Build the HTML for the popup content
    let html = `<div class="site-popup">`;
    html += `<h4>Num Tkaczow: ${data.details.num_tkaczow}</h4>`;
    if (data.details.commentaire) {
      html += `<p>${data.details.commentaire}</p>`;
    }

    if (data.vestiges.length > 0) {
      html += `<strong>Vestiges:</strong><ul>`;
      data.vestiges.forEach(v => {
        html += `<li>${v.caracterisation} (${v.periode || 'N/A'})</li>`;
      });
      html += `</ul>`;
    }

    if (data.bibliographies.length > 0) {
      html += `<strong>Bibliographie:</strong><ul>`;
      data.bibliographies.forEach(b => {
        html += `<li>${b.nom_document}</li>`;
      });
      html += `</ul>`;
    }
    html += `</div>`;

    // Create and display the popup
    this.popup = new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(this.map);
  }
  // ** END: NEW METHODS FOR POPUP **

  toggleLayerVisibility(layerId, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
  }

  async updateMapFilter() {
    const activeFilters = this.filterCollection.getActiveFilters();

    if (activeFilters.length === 0) {
      this.map.setFilter('sites_fouilles-points', null);
      return;
    }

    const filteredIdsAsString = await this.filterCollection.getFilteredIds();
    const filteredIds = filteredIdsAsString.map(id => Number(id));

    if (filteredIds && filteredIds.length > 0) {
      const filter = ['in', ['id'], ['literal', filteredIds]];
      this.map.setFilter('sites_fouilles-points', filter);
    } else {
      this.map.setFilter('sites_fouilles-points', ['in', ['id'], '']);
    }
  }
}