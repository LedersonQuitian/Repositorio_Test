/**
 * screens/catalog.js - Pantalla de catálogo filtrable
 */

import { api } from '../api.js?v=20260612-17';
import { initLayout } from '../layout.js?v=20260612-17';
import * as components from '../components.js?v=20260612-17';

export async function renderCatalog() {
  const layout = await initLayout({ screenCode: 'catalog', pageTitle: 'Catálogo de Productos' });
  const contentEl = layout.getContentElement();

  // Estado de filtros
  let currentFilters = {};
  let searchTerm = '';
  let allProducts = [];
  let filteredProducts = [];

  // Cargar opciones de catálogo
  const catalogOptions = api.getCatalogOptions();

  // Renderizar pantalla
  const html = `
    <div class="row">
      <!-- Sidebar de filtros -->
      <div class="col-md-3">
        <div id="filters-container">
          ${components.loadingSpinner()}
        </div>
      </div>

      <!-- Grid de productos -->
      <div class="col-md-9">
        <!-- Buscador por ID o descripción -->
        <div class="mb-3">
          <div class="input-group">
            <span class="input-group-text"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.156a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg></span>
            <input type="text" id="search-input" class="form-control" placeholder="Buscar por ID o descripción..." autocomplete="off">
            <button class="btn btn-outline-secondary" id="clear-search-btn" type="button" title="Limpiar búsqueda">&times;</button>
          </div>
        </div>

        <div class="mb-3 d-flex justify-content-between align-items-center">
          <h5>Resultados: <span id="result-count">0</span> productos</h5>
          <div class="d-flex gap-2">
            <a class="btn btn-sm btn-success" href="#/admin">Nuevo</a>
            <button class="btn btn-sm btn-outline-secondary" id="clear-filters-btn">
              Limpiar filtros
            </button>
          </div>
        </div>
        <div id="products-container" class="row g-3">
          ${components.loadingSpinner()}
        </div>
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  // Función para cargar y mostrar productos
  async function loadAndRenderProducts() {
    allProducts = api.getPublishedProducts();
    let byFilters = api.filterProducts(currentFilters);

    // Aplicar búsqueda por ID o nombre
    const term = searchTerm.trim().toLowerCase();
    if (term !== '') {
      byFilters = byFilters.filter(p =>
        (p.id  && p.id.toString().toLowerCase().includes(term)) ||
        (p.name && p.name.toLowerCase().includes(term))
      );
    }

    filteredProducts = byFilters;
    renderProducts();
    updateResultCount();
  }

  // Función para renderizar la grid de productos
  function renderProducts() {
    const container = document.getElementById('products-container');
    
    if (filteredProducts.length === 0) {
      container.innerHTML = components.emptyState('No se encontraron productos con estos filtros');
      return;
    }

    const cardsHtml = filteredProducts.map(product => 
      components.productCard(product, () => navigateToDetail(product.id))
    ).join('');

    container.innerHTML = `<div class="row g-3">${cardsHtml.split('').reduce((acc, char, idx) => {
      return acc + char;
    }, '')}</div>`;

    // Render individual cards
    container.innerHTML = filteredProducts.map(product => `
      <div class="col-md-6 col-lg-4">
        ${components.productCard(product)}
      </div>
    `).join('');

    // Agregar listeners
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const productId = card.dataset.productId;
        navigateToDetail(productId);
      });
      card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      });
      card.addEventListener('mouseout', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '';
      });
    });
  }

  // Función para actualizar conteo
  function updateResultCount() {
    document.getElementById('result-count').textContent = filteredProducts.length;
  }

  // Función para renderizar filtros
  function renderFilters() {
    const filtersContainer = document.getElementById('filters-container');
    
    let filtersHtml = '<h6 class="mb-3">Filtros</h6>';
    
    // Filtro: Material
    const materials = catalogOptions.materials.map(m => m.value);
    filtersHtml += components.filterCheckbox('Material', 'material', materials);
    
    // Filtro: Sector
    const sectors = catalogOptions.sectors.map(s => s.value);
    filtersHtml += components.filterCheckbox('Sector', 'sector', sectors);
    
    // Filtro: Aplicación
    const applications = catalogOptions.applications.map(a => a.value);
    filtersHtml += components.filterCheckbox('Aplicación', 'application', applications);
    
    // Filtro: Tipo de Producto
    const productTypes = catalogOptions.productTypes.map(pt => pt.value);
    filtersHtml += components.filterCheckbox('Tipo de Producto', 'productType', productTypes);

    // Filtros derivados dinámicos
    const colors = api.getFilterOptions('color');
    if (colors.length > 0) {
      filtersHtml += components.filterCheckbox('Color (variantes)', 'color', colors);
    }

    const capacities = api.getFilterOptions('capacity');
    if (capacities.length > 0) {
      filtersHtml += components.filterCheckbox('Capacidad (variantes)', 'capacity', capacities);
    }

    filtersContainer.innerHTML = filtersHtml;

    // Agregar listeners a checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => applyFilters());
    });
  }

  // Función para aplicar filtros
  function applyFilters() {
    currentFilters = {};

    document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
      const dimension = checkbox.dataset.dimension;
      const value = checkbox.dataset.value;

      if (!currentFilters[dimension]) {
        currentFilters[dimension] = [];
      }
      currentFilters[dimension].push(value);
    });

    loadAndRenderProducts();
  }

  // Función para limpiar filtros
  function clearFilters() {
    currentFilters = {};
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    loadAndRenderProducts();
  }

  // Función para limpiar búsqueda
  function clearSearch() {
    searchTerm = '';
    const input = document.getElementById('search-input');
    if (input) input.value = '';
    loadAndRenderProducts();
  }

  // Navegar a detalle
  function navigateToDetail(productId) {
    window.location.hash = `#/detail/${productId}`;
  }

  // Event listener: Limpiar filtros
  document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

  // Event listeners: Buscador
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    loadAndRenderProducts();
  });
  document.getElementById('clear-search-btn').addEventListener('click', clearSearch);

  // Iniciar carga
  renderFilters();
  await loadAndRenderProducts();
}
