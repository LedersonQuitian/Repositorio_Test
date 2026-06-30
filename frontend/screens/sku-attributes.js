/**
 * screens/sku-attributes.js - Administración de Atributos de SKUs
 */

import { api } from '../api.js?v=20260612-15';
import { initLayout } from '../layout.js?v=20260612-15';

export async function renderSkuAttributes() {
  const layout = await initLayout({ screenCode: 'sku-attributes', pageTitle: 'Atributos de SKUs' });
  const contentEl = layout.getContentElement();

  let selectedSkuId = null;
  let searchQuery = '';
  let filters = {
    length: '',
    width: '',
    height: '',
    weight: '',
    color: '',
    size: '',
    capacity: ''
  };

  const catalogOptions = api.getCatalogOptions();

  // Atributos que requieren unidad de medida (valor + unidad)
  const DIMENSION_ATTRIBUTES = {
    length: { label: 'Largo', key: 'length', units: catalogOptions.dimensionUnits || [] },
    width: { label: 'Ancho', key: 'width', units: catalogOptions.dimensionUnits || [] },
    height: { label: 'Alto', key: 'height', units: catalogOptions.dimensionUnits || [] },
    weight: { label: 'Peso', key: 'weight', units: catalogOptions.weightUnits || [] }
  };

  // Atributos simples (solo lista desplegable)
  const SIMPLE_ATTRIBUTES = {
    color: { label: 'Color', key: 'color', options: catalogOptions.materials || [] },
    size: { label: 'Tamaño', key: 'size', options: catalogOptions.applications || [] },
    capacity: { label: 'Capacidad', key: 'capacity', options: catalogOptions.applications || [] }
  };

  // Mapear atributos a opciones del catálogo
  const ATTRIBUTES = {
    ...DIMENSION_ATTRIBUTES,
    ...SIMPLE_ATTRIBUTES
  };

  function filterSkus(skus, query, filterValues) {
    let result = skus;

    // Filtro por código/búsqueda
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(sku => sku.code.toLowerCase().includes(q));
    }

    // Filtro por atributos
    Object.entries(filterValues).forEach(([attrKey, attrValue]) => {
      if (attrValue.trim()) {
        const searchTerm = attrValue.toLowerCase();
        result = result.filter(sku => {
          const skuAttrValue = (sku.attributes?.[attrKey] || '').toLowerCase();
          return skuAttrValue.includes(searchTerm);
        });
      }
    });

    return result;
  }

  function renderSkuList() {
    const allSkus = api.getSkus();
    const skus = filterSkus(allSkus, searchQuery, filters);

    return `
      <div class="row g-4">
        <div class="col-12">
          <h4>Administración de Atributos de SKUs</h4>
        </div>

        <!-- Buscador por código -->
        <div class="col-12">
          <div class="input-group">
            <span class="input-group-text">🔍</span>
            <input type="text" class="form-control search-sku" placeholder="Buscar por código de SKU..." value="${searchQuery}">
          </div>
        </div>

        <!-- Filtros por atributos -->
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-light">
              <h6 class="mb-0">🔎 Filtrar por Atributos</h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <!-- Filtros de dimensión y peso -->
                <div class="col-12">
                  <small class="fw-bold text-muted">Dimensiones y Peso:</small>
                </div>
                ${Object.entries(DIMENSION_ATTRIBUTES).map(([key, attr]) => `
                  <div class="col-md-4 col-lg-2">
                    <label class="form-label small fw-bold">${attr.label}</label>
                    <input 
                      type="text" 
                      class="form-control form-control-sm filter-attr" 
                      data-filter="${key}"
                      value="${filters[key]}"
                      placeholder="Filtrar..."
                    >
                  </div>
                `).join('')}
                
                <!-- Filtros simples -->
                <div class="col-12">
                  <small class="fw-bold text-muted">Características:</small>
                </div>
                ${Object.entries(SIMPLE_ATTRIBUTES).map(([key, attr]) => `
                  <div class="col-md-4 col-lg-2">
                    <label class="form-label small fw-bold">${attr.label}</label>
                    <input 
                      type="text" 
                      class="form-control form-control-sm filter-attr" 
                      data-filter="${key}"
                      value="${filters[key]}"
                      placeholder="Filtrar..."
                    >
                  </div>
                `).join('')}
                
                <div class="col-md-4 col-lg-2 d-flex align-items-end">
                  <button class="btn btn-sm btn-outline-secondary w-100 clear-filters-btn">Limpiar Filtros</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de SKUs -->
        <div class="col-lg-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h6 class="mb-0">SKUs Disponibles (${skus.length})</h6>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush" style="max-height: 500px; overflow-y: auto;">
                ${skus.length === 0 ? `
                  <div class="p-3 text-muted text-center">
                    ${searchQuery || Object.values(filters).some(v => v.trim()) ? 'No se encontraron SKUs' : 'No hay SKUs disponibles'}
                  </div>
                ` : skus.map(sku => `
                  <button class="list-group-item list-group-item-action sku-item ${selectedSkuId === sku.id ? 'active' : ''}" data-sku-id="${sku.id}" style="text-align: left;">
                    <div class="fw-bold">${sku.code}</div>
                    <small class="text-muted">ID: ${sku.id}</small>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Editor de atributos -->
        <div class="col-lg-8">
          ${selectedSkuId ? renderAttributeEditor() : `
            <div class="card">
              <div class="card-body text-center text-muted py-5">
                <p>Selecciona un SKU para editar sus atributos</p>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderAttributeEditor() {
    const sku = api.getSkuById(selectedSkuId);
    if (!sku) return '<div class="alert alert-danger">SKU no encontrado</div>';

    // Parsear valores guardados (formato: "30 cm", "500 g", etc.)
    function parseValue(attrValue) {
      if (!attrValue) return { value: '', unit: '' };
      const parts = attrValue.split(' ');
      return {
        value: parts[0] || '',
        unit: parts.slice(1).join(' ') || ''
      };
    }

    return `
      <div class="card">
        <div class="card-header bg-success text-white">
          <h6 class="mb-0">Editar Atributos - ${sku.code}</h6>
        </div>
        <div class="card-body">
          <!-- Atributos con Unidad de Medida -->
          <div class="mb-4">
            <h6 class="border-bottom pb-2">📏 Dimensiones y Peso</h6>
            <div class="row g-3">
              ${Object.entries(DIMENSION_ATTRIBUTES).map(([key, attr]) => {
                const parsed = parseValue(sku.attributes?.[key] || '');
                return `
                  <div class="col-md-6">
                    <label class="form-label fw-bold">${attr.label}</label>
                    <div class="input-group">
                      <input 
                        type="number" 
                        class="form-control dimension-value" 
                        data-attr="${key}"
                        value="${parsed.value}"
                        placeholder="Valor"
                        step="0.1"
                      >
                      <select class="form-select dimension-unit" data-attr="${key}">
                        <option value="">Unidad</option>
                        ${attr.units.map(unit => `
                          <option value="${unit.value}" ${parsed.unit === unit.value ? 'selected' : ''}>
                            ${unit.label}
                          </option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Atributos Simples (Listas) -->
          <div>
            <h6 class="border-bottom pb-2">🏷️ Características</h6>
            <div class="row g-3">
              ${Object.entries(SIMPLE_ATTRIBUTES).map(([key, attr]) => {
                const currentValue = sku.attributes?.[key] || '';
                const hasOptions = attr.options && attr.options.length > 0;
                
                return `
                  <div class="col-md-6">
                    <label class="form-label fw-bold">${attr.label}</label>
                    ${hasOptions ? `
                      <select class="form-select simple-attr" data-attr="${key}">
                        <option value="">-- Seleccionar ${attr.label.toLowerCase()} --</option>
                        ${attr.options.map(opt => `
                          <option value="${opt.value}" ${currentValue === opt.value ? 'selected' : ''}>
                            ${opt.label}
                          </option>
                        `).join('')}
                        <option value="otro" ${currentValue && !attr.options.find(o => o.value === currentValue) ? 'selected' : ''}>
                          ✏️ Otro valor
                        </option>
                      </select>
                      ${(currentValue && !attr.options.find(o => o.value === currentValue)) ? `
                        <input type="text" class="form-control simple-custom-input mt-2" data-attr="${key}" value="${currentValue}" placeholder="Ingresa un valor personalizado">
                      ` : ''}
                    ` : `
                      <input 
                        type="text" 
                        class="form-control simple-attr" 
                        data-attr="${key}" 
                        value="${currentValue}"
                        placeholder="Ingresa ${attr.label.toLowerCase()}"
                      >
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-success save-attributes-btn">💾 Guardar Atributos</button>
          <button class="btn btn-secondary clear-attributes-btn">🗑️ Limpiar</button>
        </div>
      </div>
    `;
  }

  function render() {
    contentEl.innerHTML = renderSkuList();
    attachEventListeners();
  }

  function attachEventListeners() {
    // Búsqueda por código
    const searchInput = contentEl.querySelector('.search-sku');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }

    // Filtros por atributos
    contentEl.querySelectorAll('.filter-attr').forEach(input => {
      input.addEventListener('input', (e) => {
        const filterKey = input.dataset.filter;
        filters[filterKey] = e.target.value;
        render();
      });
    });

    // Limpiar filtros
    const clearFiltersBtn = contentEl.querySelector('.clear-filters-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        searchQuery = '';
        filters = {
          length: '',
          width: '',
          height: '',
          weight: '',
          color: '',
          size: '',
          capacity: ''
        };
        selectedSkuId = null;
        render();
      });
    }

    // Seleccionar SKU
    contentEl.querySelectorAll('.sku-item').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSkuId = btn.dataset.skuId;
        render();
      });
    });

    // Guardar atributos
    const saveBtn = contentEl.querySelector('.save-attributes-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveAttributes);
    }

    // Limpiar atributos
    const clearBtn = contentEl.querySelector('.clear-attributes-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAttributes);
    }

    // Manejar cambios en selects de "otro valor" para atributos simples
    contentEl.querySelectorAll('.simple-attr').forEach(select => {
      if (select.tagName === 'SELECT') {
        select.addEventListener('change', (e) => {
          const key = select.dataset.attr;
          let customInput = contentEl.querySelector(`.simple-custom-input[data-attr="${key}"]`);
          
          if (e.target.value === 'otro') {
            // Mostrar input personalizado
            if (!customInput) {
              customInput = document.createElement('input');
              customInput.type = 'text';
              customInput.className = 'form-control simple-custom-input mt-2';
              customInput.dataset.attr = key;
              customInput.placeholder = `Ingresa un valor personalizado para ${SIMPLE_ATTRIBUTES[key].label.toLowerCase()}`;
              select.parentElement.appendChild(customInput);
            }
            customInput.style.display = 'block';
          } else if (customInput) {
            // Ocultar input personalizado
            customInput.style.display = 'none';
          }
        });
      }
    });
  }

  function saveAttributes() {
    if (!selectedSkuId) return;

    const updates = {};
    
    // Procesar atributos de dimensión (valor + unidad)
    const dimensionKeys = Object.keys(DIMENSION_ATTRIBUTES);
    dimensionKeys.forEach(key => {
      const valueInput = contentEl.querySelector(`.dimension-value[data-attr="${key}"]`);
      const unitSelect = contentEl.querySelector(`.dimension-unit[data-attr="${key}"]`);
      
      if (valueInput && unitSelect) {
        const value = valueInput.value.trim();
        const unit = unitSelect.value.trim();
        
        if (value || unit) {
          // Guardar como "30 cm" o solo "30" si no hay unidad
          updates[key] = unit ? `${value} ${unit}` : value;
        }
      }
    });

    // Procesar atributos simples (selects)
    contentEl.querySelectorAll('.simple-attr').forEach(input => {
      const key = input.dataset.attr;
      let value = input.value.trim();
      
      if (input.tagName === 'SELECT') {
        // Si el select tiene "otro" seleccionado, buscar el input personalizado
        if (value === 'otro') {
          const customInput = contentEl.querySelector(`.simple-custom-input[data-attr="${key}"]`);
          if (customInput) {
            value = customInput.value.trim();
          } else {
            value = '';
          }
        }
      }
      
      if (value) {
        updates[key] = value;
      }
    });
    
    // Procesar inputs personalizados que no están ligados a un select
    contentEl.querySelectorAll('.simple-custom-input').forEach(input => {
      const key = input.dataset.attr;
      const value = input.value.trim();
      if (value && !updates[key]) {
        updates[key] = value;
      }
    });

    try {
      api.updateSkuAttributes(selectedSkuId, updates);
      showAlert('Atributos guardados correctamente', 'success');
      render();
    } catch (error) {
      showAlert('Error al guardar: ' + error.message, 'danger');
    }
  }

  function clearAttributes() {
    // Limpiar atributos de dimensión
    contentEl.querySelectorAll('.dimension-value').forEach(input => {
      input.value = '';
    });
    
    contentEl.querySelectorAll('.dimension-unit').forEach(select => {
      select.value = '';
    });

    // Limpiar atributos simples
    contentEl.querySelectorAll('.simple-attr').forEach(input => {
      if (input.tagName === 'SELECT') {
        input.value = '';
        const customInput = contentEl.querySelector(`.simple-custom-input[data-attr="${input.dataset.attr}"]`);
        if (customInput) {
          customInput.style.display = 'none';
          customInput.value = '';
        }
      } else {
        input.value = '';
      }
    });
    
    contentEl.querySelectorAll('.simple-custom-input').forEach(input => {
      input.value = '';
    });
  }

  function showAlert(message, type = 'info') {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertEl.style.zIndex = '9999';
    alertEl.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertEl);
    
    setTimeout(() => alertEl.remove(), 4000);
  }

  render();
}
