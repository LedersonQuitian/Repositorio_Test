/**
 * screens/admin.js - Administración de atributos de ProductMasters existentes
 * 
 * Permite editar atributos de productos ya creados (sin crear nuevos)
 */

import { api } from '../api.js?v=20260612-17';
import { initLayout } from '../layout.js?v=20260612-17';
import * as derive from '../domain/derive.js?v=20260612-17';

function renderSelectOptions(options = []) {
  const optionHtml = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');
  return `<option value="">Seleccionar...</option>${optionHtml}`;
}

function renderSkuCheckboxes(skus = []) {
  if (!Array.isArray(skus) || skus.length === 0) {
    return '<div class="text-muted small">No hay SKUs disponibles.</div>';
  }

  return skus.map(sku => `
    <div class="form-check">
      <input class="form-check-input sku-checkbox" type="checkbox" id="sku-${sku.id}" value="${sku.id}">
      <label class="form-check-label" for="sku-${sku.id}">
        <strong>${sku.code}</strong>
        <span class="text-muted">(${sku.attributes?.color || '-'} / ${sku.attributes?.capacity || '-'})</span>
      </label>
    </div>
  `).join('');
}

export async function renderAdmin(productId = null) {
  // Si no hay productId, redirigir al catálogo
  if (!productId) {
    window.location.hash = '#/catalog';
    return;
  }

  const layout = await initLayout({ screenCode: 'admin', pageTitle: 'Editar Producto', productId });
  const contentEl = layout.getContentElement();

  const catalogOptions = api.getCatalogOptions();
  const allSkus = api.getSkus();

  const product = api.getProductById(productId);
  
  if (!product) {
    contentEl.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Producto no encontrado
      </div>
      <a href="#/catalog" class="btn btn-secondary">← Volver al Catálogo</a>
    `;
    return;
  }

  let selectedId = productId;

  contentEl.innerHTML = `
    <div class="row g-4">
      <div class="col-12">
        <div id="admin-alert"></div>
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Editar: ${product.name}</h5>
            <small class="text-muted">${product.id}</small>
          </div>
          <div class="card-body">
            <form id="admin-form" class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" id="f-name" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">ID</label>
                <input type="text" class="form-control" id="f-id" disabled>
              </div>

              <div class="col-md-4">
                <label class="form-label">Categoría Principal</label>
                <select class="form-select category-level-0" id="f-category-level-0" data-level="0">
                  <option value="">Seleccionar...</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Categoría Secundaria</label>
                <select class="form-select category-level-1" id="f-category-level-1" data-level="1" disabled>
                  <option value="">Seleccionar...</option>
                </select>
              </div>

              <div class="col-md-4">
                <label class="form-label">Categoría Terciaria</label>
                <select class="form-select category-level-2" id="f-category-level-2" data-level="2" disabled>
                  <option value="">Seleccionar...</option>
                </select>
              </div>
              <div class="col-md-8">
                <label class="form-label">Estado</label>
                <select class="form-select" id="f-status" disabled>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" id="f-description" rows="2"></textarea>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Atributos gestionados</h6>
              </div>

              <div class="col-md-6">
                <label class="form-label">Material</label>
                <select class="form-select" id="f-material">${renderSelectOptions(catalogOptions.materials)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Sector</label>
                <select class="form-select" id="f-sector">${renderSelectOptions(catalogOptions.sectors)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Aplicación</label>
                <select class="form-select" id="f-application">${renderSelectOptions(catalogOptions.applications)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de producto</label>
                <select class="form-select" id="f-productType">${renderSelectOptions(catalogOptions.productTypes)}</select>
              </div>

              <div class="col-12">
                <h6 class="mt-2">SKUs asociados</h6>
                <div class="border rounded p-2" style="max-height: 220px; overflow: auto;" id="f-sku-list">
                  ${renderSkuCheckboxes(allSkus)}
                </div>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Derivados (read-only)</h6>
                <div class="border rounded p-3 bg-light" id="derived-preview">
                  <span class="text-muted">Selecciona SKUs para calcular derivados.</span>
                </div>
              </div>

              <div class="col-12 d-flex gap-2 mt-3">
                <button type="button" class="btn btn-primary" id="save-changes-btn">Guardar cambios</button>
                <button type="button" class="btn btn-light" id="cancel-edit-btn">Cancelar</button>
                <a href="#/detail/${productId}" class="btn btn-outline-secondary ms-auto">← Volver al Detalle</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const alertEl = document.getElementById('admin-alert');

  const idEl = document.getElementById('f-id');
  const nameEl = document.getElementById('f-name');
  const categoryLevel0El = document.getElementById('f-category-level-0');
  const categoryLevel1El = document.getElementById('f-category-level-1');
  const categoryLevel2El = document.getElementById('f-category-level-2');
  const statusEl = document.getElementById('f-status');
  const descriptionEl = document.getElementById('f-description');
  const materialEl = document.getElementById('f-material');
  const sectorEl = document.getElementById('f-sector');
  const applicationEl = document.getElementById('f-application');
  const productTypeEl = document.getElementById('f-productType');

  function showAlert(message, type = 'danger') {
    alertEl.innerHTML = `
      <div class="alert alert-${type} alert-dismissible" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }

  function clearAlert() {
    alertEl.innerHTML = '';
  }

  function getSelectedSkuIds() {
    return Array.from(document.querySelectorAll('.sku-checkbox:checked')).map(cb => cb.value);
  }

  function updateDerivedPreview() {
    const selectedSkuIds = new Set(getSelectedSkuIds());
    const selectedSkus = allSkus.filter(s => selectedSkuIds.has(s.id));
    const derived = derive.computeDerivedAttributes(selectedSkus);

    const section = (label, values) => {
      if (!values || values.length === 0) {
        return `<div><strong>${label}:</strong> <span class="text-muted">-</span></div>`;
      }
      const badges = values.map(v => `<span class="badge text-bg-light border me-1">${v}</span>`).join('');
      return `<div><strong>${label}:</strong> ${badges}</div>`;
    };

    document.getElementById('derived-preview').innerHTML = `
      ${section('Colors', derived.colors)}
      ${section('Capacities', derived.capacities)}
      ${section('Sizes', derived.sizes)}
    `;
  }

  function fillForm(product) {
    idEl.value = product.id || '';
    nameEl.value = product.name || '';
    statusEl.value = product.status || 'draft';
    descriptionEl.value = product.description || '';

    materialEl.value = product.managedAttributes?.material || '';
    sectorEl.value = product.managedAttributes?.sector || '';
    applicationEl.value = product.managedAttributes?.application || '';
    productTypeEl.value = product.managedAttributes?.productType || '';

    // Cargar categoría jerárquica
    const categoryId = product.categoryId;
    loadCategoryHierarchy(categoryId);

    const selectedSkuIds = new Set(product.skuIds || []);
    document.querySelectorAll('.sku-checkbox').forEach(cb => {
      cb.checked = selectedSkuIds.has(cb.value);
    });

    updateDerivedPreview();
  }

  function loadCategoryHierarchy(selectedCategoryId) {
    const allRoots = api.getRootCategories();

    // Limpiar selectores
    categoryLevel0El.innerHTML = '<option value="">Seleccionar...</option>';
    categoryLevel1El.innerHTML = '<option value="">Seleccionar...</option>';
    categoryLevel2El.innerHTML = '<option value="">Seleccionar...</option>';
    categoryLevel1El.disabled = true;
    categoryLevel2El.disabled = true;

    // Cargar nivel 0 (siempre disponible)
    categoryLevel0El.innerHTML += allRoots.map(cat => 
      `<option value="${cat.id}">${cat.label}</option>`
    ).join('');

    if (!selectedCategoryId) return;

    // Obtener la categoría seleccionada
    const selectedCategory = api.getCategoryById(selectedCategoryId);
    if (!selectedCategory) return;

    // Cargar según el nivel
    if (selectedCategory.level === 0) {
      categoryLevel0El.value = selectedCategoryId;
    } else if (selectedCategory.level === 1) {
      // Es categoría nivel 1: cargar su padre (nivel 0) y sus hijos (nivel 2)
      const parents = api.getParentCategories(selectedCategoryId);
      if (parents.length > 0) {
        const parentId = parents[0].id; // Seleccionar el primer padre
        categoryLevel0El.value = parentId;
        
        // Cargar nivel 1 (hijos del padre)
        const level1Children = api.getChildCategories(parentId, 1);
        categoryLevel1El.innerHTML = '<option value="">Seleccionar...</option>' +
          level1Children.map(cat => 
            `<option value="${cat.id}" ${cat.id === selectedCategoryId ? 'selected' : ''}>${cat.label}</option>`
          ).join('');
        categoryLevel1El.disabled = false;
      }
    } else if (selectedCategory.level === 2) {
      // Es categoría nivel 2: cargar sus padres (nivel 1) y abuelos (nivel 0)
      const parents = api.getParentCategories(selectedCategoryId);
      if (parents.length > 0) {
        const parentId = parents[0].id; // Seleccionar el primer padre (nivel 1)
        const grandparents = api.getParentCategories(parentId);
        
        if (grandparents.length > 0) {
          const grandparentId = grandparents[0].id; // Seleccionar el primer abuelo (nivel 0)
          categoryLevel0El.value = grandparentId;
          
          // Cargar nivel 1
          const level1Children = api.getChildCategories(grandparentId, 1);
          categoryLevel1El.innerHTML = '<option value="">Seleccionar...</option>' +
            level1Children.map(cat => 
              `<option value="${cat.id}" ${cat.id === parentId ? 'selected' : ''}>${cat.label}</option>`
            ).join('');
          categoryLevel1El.disabled = false;
          
          // Cargar nivel 2
          const level2Children = api.getChildCategories(parentId, 2);
          categoryLevel2El.innerHTML = '<option value="">Seleccionar...</option>' +
            level2Children.map(cat => 
              `<option value="${cat.id}" ${cat.id === selectedCategoryId ? 'selected' : ''}>${cat.label}</option>`
            ).join('');
          categoryLevel2El.disabled = false;
        }
      }
    }
  }

  async function saveChanges() {
    clearAlert();
    try {
      const payload = {
        name: nameEl.value.trim(),
        categoryId: categoryLevel2El.value || categoryLevel1El.value || categoryLevel0El.value || null,
        description: descriptionEl.value.trim(),
        managedAttributes: {
          material: materialEl.value,
          sector: sectorEl.value,
          application: applicationEl.value,
          productType: productTypeEl.value
        },
        skuIds: getSelectedSkuIds()
      };

      api.updateProduct(selectedId, payload);
      showAlert('Cambios guardados correctamente', 'success');

      // Recargar información del producto
      const updated = api.getProductById(selectedId);
      fillForm(updated);
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  // Event listeners
  document.getElementById('save-changes-btn').addEventListener('click', saveChanges);

  document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    const product = api.getProductById(selectedId);
    fillForm(product);
    clearAlert();
  });

  document.querySelectorAll('.sku-checkbox').forEach(cb => {
    cb.addEventListener('change', updateDerivedPreview);
  });

  // Event listeners para jerarquía de categorías
  categoryLevel0El.addEventListener('change', function() {
    categoryLevel1El.innerHTML = '<option value="">Seleccionar...</option>';
    categoryLevel2El.innerHTML = '<option value="">Seleccionar...</option>';
    categoryLevel2El.disabled = true;

    if (this.value) {
      const children = api.getChildCategories(this.value, 1);
      if (children.length > 0) {
        categoryLevel1El.innerHTML = '<option value="">Seleccionar...</option>' + 
          children.map(cat => `<option value="${cat.id}">${cat.label}</option>`).join('');
        categoryLevel1El.disabled = false;
      } else {
        categoryLevel1El.disabled = true;
      }
    } else {
      categoryLevel1El.disabled = true;
    }
  });

  categoryLevel1El.addEventListener('change', function() {
    categoryLevel2El.innerHTML = '<option value="">Seleccionar...</option>';

    if (this.value) {
      const children = api.getChildCategories(this.value, 2);
      if (children.length > 0) {
        categoryLevel2El.innerHTML = '<option value="">Seleccionar...</option>' + 
          children.map(cat => `<option value="${cat.id}">${cat.label}</option>`).join('');
        categoryLevel2El.disabled = false;
      } else {
        categoryLevel2El.disabled = true;
      }
    } else {
      categoryLevel2El.disabled = true;
    }
  });

  // Inicializar formulario con el producto
  fillForm(product);
}
