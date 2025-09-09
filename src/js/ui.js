/**
 * This module handles the creation and event handling of the filter UI.
 */

// This function will be called when a filter input changes.
let onFilterChangeCallback = () => {};

/**
 * Dynamically builds the filter UI inside the #volet_haut element.
 * @param {object} filters - The filter objects from the FilterCollection.
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

  // Add event listeners for toggling dropdowns
  document.querySelectorAll('.filter-name').forEach(button => {
    button.addEventListener('click', () => {
      const subFilterContainer = button.nextElementSibling.nextElementSibling;
      subFilterContainer.style.display = subFilterContainer.style.display === 'none' ? 'block' : 'none';
    });
  });

  document.querySelectorAll('.subfilter-title').forEach(title => {
    title.addEventListener('click', () => {
      const subFilterContent = title.nextElementSibling;
      subFilterContent.style.display = subFilterContent.style.display === 'none' ? 'block' : 'none';
    });
  });
  
  // Attach event listeners to the newly created checkboxes
  attachCheckboxListeners(filters);
}

/**
 * Attaches change event listeners to all filter checkboxes.
 * @param {object} filters - The filter objects from the FilterCollection.
 */
function attachCheckboxListeners(filters) {
  document.querySelectorAll('.subfilter-content input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const { name, value, checked } = e.target;
      const filterName = e.target.closest('.filter-content').querySelector('.filter-name').textContent.toLowerCase();
      
      const filter = filters[filterName];
      const subFilter = filter.getSubFilter(name);

      if (checked) {
        subFilter.checkValue(value);
      } else {
        subFilter.unCheckValue(value);
      }

      filter.active = filter.getSubFilters().some(sf => sf.getSelectedValues().length > 0);
      onFilterChangeCallback();
    });
  });
}

/**
 * Sets the callback function and initializes UI event listeners.
 * @param {function} callback 
 */
export function addFilterEventListeners(callback) {
  onFilterChangeCallback = callback;

  // ** START: FIX FOR PANEL TOGGLE **
  const voletHautClos = document.getElementById('volet_haut_clos');
  const voletHaut = document.getElementById('volet_haut');
  const openBtn = voletHautClos.querySelector('.onglets_haut a.ouvrir');
  const closeBtn = voletHautClos.querySelector('.onglets_haut a.fermer');

  if (voletHaut && openBtn && closeBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      voletHaut.classList.add('is-open');
    });

    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      voletHaut.classList.remove('is-open');
    });
  }
  // ** END: FIX FOR PANEL TOGGLE **
}