import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, buildLayerList, attachAllEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    this.filterCollection = null;
  }

  async initialize() {
    console.log('Initializing application...');
    
    // 1. Initialize filters and layers, which builds their respective UI elements.
    await this.initFilters();
    this.initLayerList();

    // 2. NOW, attach all event listeners to the newly created UI.
    this.initEventListeners();
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
    // This single function now attaches all listeners for all UI elements.
    attachAllEventListeners(
      this.filterCollection.getFilters(),
      // Callback for when a filter changes
      async () => { await this.updateMapFilter(); },
      // Callback for when a layer visibility changes
      (layerId, isVisible) => { this.toggleLayerVisibility(layerId, isVisible); }
    );
  }

  toggleLayerVisibility(layerId, isVisible) {
    const visibility = isVisible ? 'visible' : 'none';
    this.map.setLayoutProperty(layerId, 'visibility', visibility);
    console.log(`Set layer ${layerId} visibility to ${visibility}`);
  }

  async updateMapFilter() {
    console.log('Updating map filter...');
    const activeFilters = this.filterCollection.getActiveFilters();

    if (activeFilters.length === 0) {
      this.map.setFilter('sites_fouilles-points', null);
      console.log('No active filters. Showing all sites.');
      return;
    }

    const filteredIds = await this.filterCollection.getFilteredIds();
    
    // Note: MapLibre's `in` filter was updated. The new syntax is more verbose.
    if (filteredIds && filteredIds.length > 0) {
      const filter = ['in', ['get', 'fid'], ['literal', filteredIds]];
      this.map.setFilter('sites_fouilles-points', filter);
      console.log(`Filtered to ${filteredIds.length} sites.`);
    } else {
      this.map.setFilter('sites_fouilles-points', ['in', ['get', 'fid'], '']);
      console.log('Filters are active but no sites matched.');
    }
  }
}