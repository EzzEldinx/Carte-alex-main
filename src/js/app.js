import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, addFilterEventListeners, buildLayerList, addLayerEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    this.filterCollection = null;
  }

  async initialize() {
    console.log('Initializing application...');
    // Initialize both UI components
    await this.initFilters();
    this.initLayerList();
    this.initEventListeners();
  }

  async initFilters() {
    const layerName = 'sitesFouilles';
    this.filterCollection = new FilterCollection(layerName, filters_config[layerName], server_config.api_at);
    await this.filterCollection.initFilters();
    buildFilterUI(this.filterCollection.getFilters());
  }

  initLayerList() {
    // Get layers from the map's style that have a 'source' of 'cartalex'
    const cartalexLayers = this.map.getStyle().layers.filter(layer => layer.source === 'cartalex');
    buildLayerList(cartalexLayers);
  }

  initEventListeners() {
    // Add event listeners for the top filter panel
    addFilterEventListeners(async () => {
      await this.updateMapFilter();
    });

    // Add event listeners for the left layer panel
    addLayerEventListeners((layerId, isVisible) => {
      this.toggleLayerVisibility(layerId, isVisible);
    });
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