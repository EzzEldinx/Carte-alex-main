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

    const filteredIdsAsString = await this.filterCollection.getFilteredIds();
    const filteredIds = filteredIdsAsString.map(id => Number(id));

    if (filteredIds && filteredIds.length > 0) {
      // ** START: THE FINAL FIX **
      // Use the ['id'] expression to filter by the feature's top-level ID,
      // which corresponds to the 'fid' column we set in Tegola.
      const filter = ['in', ['id'], ['literal', filteredIds]];
      // ** END: THE FINAL FIX **
      
      this.map.setFilter('sites_fouilles-points', filter);
      console.log(`Filtered to ${filteredIds.length} sites.`);
    } else {
      this.map.setFilter('sites_fouilles-points', ['in', ['id'], '']);
      console.log('Filters are active but no sites matched.');
    }
  }
}