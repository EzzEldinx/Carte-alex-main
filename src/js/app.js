import { FilterCollection } from './FilterCollection.js';
import { filters_config } from './filters_config.js';
import { server_config } from './server_config.js';
import { buildFilterUI, addFilterEventListeners } from './ui.js';

export class App {
  constructor(map) {
    this.map = map;
    this.filterCollection = null;
  }

  async initialize() {
    console.log('Initializing application...');
    await this.initFilters();
    this.initEventListeners();
  }

  async initFilters() {
    // We are only filtering the 'sitesFouilles' layer in this project
    const layerName = 'sitesFouilles';
    this.filterCollection = new FilterCollection(layerName, filters_config[layerName], server_config.api_at);
    
    // Initialize filters and fetch their possible values from the API
    await this.filterCollection.initFilters();
    
    // Dynamically build the HTML for the filter panel
    buildFilterUI(this.filterCollection.getFilters());
  }

  initEventListeners() {
    // Add event listeners to the dynamically created filter UI
    addFilterEventListeners(async () => {
      // This is the callback function that runs when a filter changes
      await this.updateMapFilter();
    });
  }

  async updateMapFilter() {
    console.log('Updating map filter...');
    const activeFilters = this.filterCollection.getActiveFilters();

    if (activeFilters.length === 0) {
      // If no filters are active, show all features
      // Note: MapLibre uses `null` or `true` to clear filters
      this.map.setFilter('sites_fouilles-points', null);
      console.log('No active filters. Showing all sites.');
      return;
    }

    // Get the list of feature IDs that match the selected filters
    const filteredIds = await this.filterCollection.getFilteredIds();
    
    if (filteredIds && filteredIds.length > 0) {
      // MapLibre's 'in' filter format: ['in', propertyName, ...values]
      // The ID field from our PostGIS table is named 'fid' in the vector tile.
      const filter = ['in', 'fid', ...filteredIds];
      this.map.setFilter('sites_fouilles-points', filter);
      console.log(`Filtered to ${filteredIds.length} sites.`);
    } else {
      // If filters are active but return no results, show nothing.
      // An 'in' filter with no values will show no features.
      this.map.setFilter('sites_fouilles-points', ['in', 'fid', '']);
      console.log('Filters are active but no sites matched.');
    }
  }
}