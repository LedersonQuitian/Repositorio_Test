/**
 * screens/create-product.js - Creación de nuevos ProductMaster
 */

import { api } from '../api.js?v=20260612-14';
import { initLayout } from '../layout.js?v=20260612-14';
import * as derive from '../domain/derive.js?v=20260612-14';

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

export async function renderCreateProduct() {
  const layout = await initLayout({ screenCode: 'create-product', pageTitle: 'Crear Nuevo Producto' });
  const contentEl = layout.getContentElement();

  const catalogOptions = api.getCatalogOptions();
  const allSkus = api.getSkus();

  contentEl.innerHTML = `
    <div class="row g-4">
      <div class="col-12">
        <div id="create-alert"></div>
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Crear nuevo ProductMaster</h5>
          </div>
          <div class="card-body">
            <form id="create-form" class="row g-3">
              <div class="col-md-8">
                <label class="form-label">Nombre <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="f-name" required>
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

              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" id="f-description" rows="2"></textarea>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Atributos gestionados</h6>
              </div>

              <div class="col-md-6">
                <label class="form-label">Material <span class="text-danger">*</span></label>
                <select class="form-select" id="f-material" required>${renderSelectOptions(catalogOptions.materials)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Sector <span class="text-danger">*</span></label>
                <select class="form-select" id="f-sector" required>${renderSelectOptions(catalogOptions.sectors)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Aplicación <span class="text-danger">*</span></label>
                <select class="form-select" id="f-application" required>${renderSelectOptions(catalogOptions.applications)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de producto <span class="text-danger">*</span></label>
                <select class="form-select" id="f-productType" required>${renderSelectOptions(catalogOptions.productTypes)}</select>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Media</h6>
              </div>

              <div class="col-md-6">
                <label class="form-label">Main image URL</label>
                <input type="url" class="form-control" id="f-mainImageUrl" placeholder="https://...">
              </div>
              <div class="col-md-6">
                <label class="form-label">Thumbnail URL</label>
                <input type="url" class="form-control" id="f-thumbnailUrl" placeholder="https://...">
              </div>
              <div class="col-md-6">
                <label class="form-label">Mobile image URL</label>
                <input type="url" class="form-control" id="f-mobileImageUrl" placeholder="https://...">
              </div>
              <div class="col-md-6">
                <label class="form-label">Gallery URLs (una por línea)</label>
                <textarea class="form-control" id="f-galleryUrls" rows="2" placeholder="https://...\nhttps://..."></textarea>
              </div>

              <div class="col-12">
                <h6 class="mt-2">SKUs asociados</h6>
                <div class="border rounded p-2" style="max-height: 220px; overflow: auto;" id="f-sku-list">
                  ${renderSkuCheckboxes(allSkus)}
                </div>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Derivados (preview)</h6>
                <div class="border rounded p-3 bg-light" id="derived-preview">
                  <span class="text-muted">Selecciona SKUs para calcular derivados.</span>
                </div>
              </div>

              <div class="col-12 d-flex gap-2 mt-3">
                <button type="button" class="btn btn-outline-secondary" id="save-draft-btn">Guardar borrador</button>
                <button type="button" class="btn btn-success" id="publish-btn">Crear y publicar</button>
                <button type="button" class="btn btn-light" id="clear-form-btn">Limpiar formulario</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  const alertEl = document.getElementById('create-alert');
  const nameEl = document.getElementById('f-name');
  const categoryLevel0El = document.getElementById('f-category-level-0');
  const categoryLevel1El = document.getElementById('f-category-level-1');
  const categoryLevel2El = document.getElementById('f-category-level-2');
  const descriptionEl = document.getElementById('f-description');
  const materialEl = document.getElementById('f-material');
  const sectorEl = document.getElementById('f-sector');
  const applicationEl = document.getElementById('f-application');
  const productTypeEl = document.getElementById('f-productType');
  const mainImageUrlEl = document.getElementById('f-mainImageUrl');
  const thumbnailUrlEl = document.getElementById('f-thumbnailUrl');
  const mobileImageUrlEl = document.getElementById('f-mobileImageUrl');
  const galleryUrlsEl = document.getElementById('f-galleryUrls');

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

  function clearForm() {
    nameEl.value = '';
    categoryLevel0El.value = '';
    categoryLevel1El.value = '';
    categoryLevel2El.value = '';
    categoryLevel1El.disabled = true;
    categoryLevel2El.disabled = true;
    descriptionEl.value = '';
    materialEl.value = '';
    sectorEl.value = '';
    applicationEl.value = '';
    productTypeEl.value = '';
    mainImageUrlEl.value = '';
    thumbnailUrlEl.value = '';
    mobileImageUrlEl.value = '';
    galleryUrlsEl.value = '';

    document.querySelectorAll('.sku-checkbox').forEach(cb => {
      cb.checked = false;
    });

    updateDerivedPreview();
  }

  function buildPayload() {
    const galleryUrls = galleryUrlsEl.value
      .split('\n')
      .map(v => v.trim())
      .filter(Boolean);

    return {
      name: nameEl.value.trim(),
      description: descriptionEl.value.trim(),
      categoryId: categoryLevel2El.value || categoryLevel1El.value || categoryLevel0El.value || null,
      managedAttributes: {
        material: materialEl.value,
        sector: sectorEl.value,
        application: applicationEl.value,
        productType: productTypeEl.value
      },
      media: {
        mainImageUrl: mainImageUrlEl.value.trim(),
        thumbnailUrl: thumbnailUrlEl.value.trim(),
        mobileImageUrl: mobileImageUrlEl.value.trim(),
        galleryUrls
      },
      skuIds: getSelectedSkuIds()
    };
  }

  function validateForm() {
    if (!nameEl.value.trim()) {
      throw new Error('El nombre es requerido.');
    }
  }

  async function saveDraft() {
    clearAlert();
    try {
      validateForm();
      const payload = buildPayload();
      const created = api.createProduct({ ...payload, status: 'draft' });
      showAlert(`Producto borrador creado: ${created.id}`, 'success');
      clearForm();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  async function publishProduct() {
    clearAlert();
    try {
      validateForm();
      const payload = buildPayload();
      const created = api.createProduct(payload);
      const published = api.publishProduct(created.id);
      showAlert(`Producto publicado correctamente: ${published.id}`, 'success');
      clearForm();
    } catch (error) {
      showAlert(error.message, 'danger');
    }
  }

  // Event listeners
  document.getElementById('clear-form-btn').addEventListener('click', () => {
    clearAlert();
    clearForm();
  });

  document.getElementById('save-draft-btn').addEventListener('click', saveDraft);
  document.getElementById('publish-btn').addEventListener('click', publishProduct);

  document.querySelectorAll('.sku-checkbox').forEach(cb => {
    cb.addEventListener('change', updateDerivedPreview);
  });

  // Cargar categorías nivel 0
  const rootCategories = api.getRootCategories();
  categoryLevel0El.innerHTML = '<option value="">Seleccionar...</option>' + 
    rootCategories.map(cat => `<option value="${cat.id}">${cat.label}</option>`).join('');

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

  // Inicializar
  clearForm();
}
