/**
 * screens/catalog.js - Pantalla de catálogo filtrable
 */

import { api } from '../api.js';
import { initLayout } from '../layout.js';
import * as components from '../components.js';

export async function renderCatalog() {
  const layout = await initLayout({ screenCode: 'catalog', pageTitle: 'Catálogo de Productos' });
  const contentEl = layout.getContentElement();

  // Estado de filtros
  let currentFilters = {};
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
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <h5>Resultados: <span id="result-count">0</span> productos</h5>
          <button class="btn btn-sm btn-outline-secondary" id="clear-filters-btn">
            Limpiar filtros
          </button>
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
    filteredProducts = api.filterProducts(currentFilters);
    
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

  // Navegar a detalle
  function navigateToDetail(productId) {
    window.location.hash = `#/detail/${productId}`;
  }

  // Event listener: Limpiar filtros
  document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

  // Iniciar carga
  renderFilters();
  await loadAndRenderProducts();
}
