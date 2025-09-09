/**
 * This module handles the creation and event handling of all UI components.
 */

let onFilterChangeCallback = () => {};
let onLayerToggleCallback = () => {};

/**
 * Builds the HTML for the top filter panel.
 */
export function buildFilterUI(filters) {
  const container = document.getElementById('volet_haut');
  if (!container) return;
  
  let html = '<div class="filter-collection-content">';
  for (const filterName in filters) {
    const filter = filters[filterName];
    html += `
      <div class="filter-content">
        <button class="filter-name">${filter.name.charAt(0).toUpperCase() + filter.name.slice(1)}</button>
        <div class="filter-infos">${filter.infos}</div>
        <div class="subfilter-container" style="display: none;">
    `;
    for (const subFilter of filter.getSubFilters()) {
      html += `
        <div class="subfilter-content-wrapper">
          <h4 class="subfilter-title">${subFilter.alias || subFilter.name}</h4>
          <ul class="subfilter-content" style="display: none;">
      `;
      if (subFilter.isNumeric) {
        html += `<li>Numeric filter UI placeholder</li>`;
      } else {
        subFilter.getValues().forEach(valueObj => {
          const value = valueObj[subFilter.alias || subFilter.name];
          html += `
            <li>
              <input type="checkbox" id="${filter.name}-${subFilter.name}-${value}" name="${subFilter.name}" value="${value}">
              <label for="${filter.name}-${subFilter.name}-${value}">${value}</label>
            </li>
          `;
        });
      }
      html += `</ul></div>`;
    }
    html += `</div></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

/**
 * Builds the HTML for the left layer selection panel.
 */
export function buildLayerList(layers) {
    const container = document.getElementById('items');
    if (!container) return;

    let html = '';
    layers.forEach(layer => {
        // Use the source-layer as a more readable name
        const layerName = layer['source-layer'] || layer.id;
        html += `
            <li class="listitem">
                <input type="checkbox" id="layer-${layer.id}" data-layer-id="${layer.id}" checked>
                <label for="layer-${layer.id}">${layerName.replace(/_/g, ' ')}</label>
            </li>
        `;
    });
    container.innerHTML = html;
}

/**
 * Attaches all necessary event listeners for UI interactions.
 */
function attachAllEventListeners(filters) {
  // --- Top Filter Panel Logic ---
  const voletHautClos = document.getElementById('volet_haut_clos');
  const voletHaut = document.getElementById('volet_haut');
  const openFilterBtn = voletHautClos.querySelector('.onglets_haut a.ouvrir');
  const closeFilterBtn = voletHautClos.querySelector('.onglets_haut a.fermer');

  if (voletHaut && openFilterBtn && closeFilterBtn) {
    openFilterBtn.addEventListener('click', (e) => { e.preventDefault(); voletHaut.classList.add('is-open'); });
    closeFilterBtn.addEventListener('click', (e) => { e.preventDefault(); voletHaut.classList.remove('is-open'); });
  }

  // --- Left Layer Panel Logic ---
  const voletGaucheClos = document.getElementById('volet_gauche_clos');
  const voletGauche = document.getElementById('volet_gauche');
  const openLayerBtn = voletGaucheClos.querySelector('.onglets_gauche a.ouvrir');
  const closeLayerBtn = voletGaucheClos.querySelector('.onglets_gauche a.fermer');

  if (voletGauche && openLayerBtn && closeLayerBtn) {
      openLayerBtn.addEventListener('click', (e) => { e.preventDefault(); voletGauche.classList.add('is-open'); });
      closeLayerBtn.addEventListener('click', (e) => { e.preventDefault(); voletGauche.classList.remove('is-open'); });
  }

  // --- Filter Dropdown Logic ---
  document.querySelectorAll('.filter-name').forEach(button => {
    button.addEventListener('click', () => {
      const subContainer = button.nextElementSibling.nextElementSibling;
      subContainer.style.display = subContainer.style.display === 'none' ? 'block' : 'none';
    });
  });

  document.querySelectorAll('.subfilter-title').forEach(title => {
    title.addEventListener('click', () => {
      const content = title.nextElementSibling;
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
  });

  // --- Filter Checkbox Logic ---
  document.querySelectorAll('.subfilter-content input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const { name, value, checked } = e.target;
      const filterName = e.target.closest('.filter-content').querySelector('.filter-name').textContent.toLowerCase();
      
      const filter = filters[filterName];
      const subFilter = filter.getSubFilter(name);

      if (checked) subFilter.checkValue(value);
      else subFilter.unCheckValue(value);

      filter.active = filter.getSubFilters().some(sf => sf.getSelectedValues().length > 0);
      onFilterChangeCallback();
    });
  });

  // --- Layer Checkbox Logic ---
  document.querySelectorAll('#items input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
          const layerId = e.target.dataset.layerId;
          const isVisible = e.target.checked;
          onLayerToggleCallback(layerId, isVisible);
      });
  });
}

export function addFilterEventListeners(callback) {
  onFilterChangeCallback = callback;
}

export function addLayerEventListeners(callback) {
  onLayerToggleCallback = callback;
  // This is a good point to attach all listeners, since the DOM is ready.
  // We need the filters object from the app to wire everything up.
  // This is a bit of a workaround for the current structure.
  // A better approach would be a more formal UI initialization class.
  // We will call this from app.js after filters are ready.
}

// Re-exporting the main listener setup function
export { attachAllEventListeners };