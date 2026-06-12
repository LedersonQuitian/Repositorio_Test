/**
 * screens/admin.js - Pantalla de administracion de ProductMaster
 */

import { api } from '../api.js?v=20260612-2';
import { initLayout } from '../layout.js?v=20260612-2';
import * as derive from '../domain/derive.js?v=20260612-2';

export async function renderAdmin(productId = null) {
  const layout = await initLayout({ screenCode: 'admin', pageTitle: 'Administracion de Productos' });
  const contentEl = layout.getContentElement();

  const catalogOptions = api.getCatalogOptions();
  const allSkus = api.getSkus();

  let selectedId = productId || null;

  contentEl.innerHTML = `
    <div class="row g-4">
      <div class="col-12">
        <div id="admin-alert"></div>
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0" id="form-title">Crear ProductMaster</h5>
            <small class="text-muted" id="form-mode-badge">Modo: Crear</small>
          </div>
          <div class="card-body">
            <form id="admin-form" class="row g-3">
              <div class="col-12">
                <label class="form-label">ID</label>
                <input type="text" class="form-control" id="f-id" disabled placeholder="Se genera automaticamente">
              </div>

              <div class="col-md-8">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" id="f-name" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Categoria</label>
                <input type="text" class="form-control" id="f-category" placeholder="Ej: Bebidas">
              </div>

              <div class="col-12">
                <label class="form-label">Descripcion</label>
                <textarea class="form-control" id="f-description" rows="2"></textarea>
              </div>

              <div class="col-12">
                <h6 class="mt-2">Atributos gestionados</h6>
              </div>

              <div class="col-md-6">
                <label class="form-label">Material</label>
                <select class="form-select" id="f-material" required>${renderSelectOptions(catalogOptions.materials)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Sector</label>
                <select class="form-select" id="f-sector" required>${renderSelectOptions(catalogOptions.sectors)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Aplicacion</label>
                <select class="form-select" id="f-application" required>${renderSelectOptions(catalogOptions.applications)}</select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Tipo de producto</label>
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
                <label class="form-label">Gallery URLs (una por linea)</label>
                <textarea class="form-control" id="f-galleryUrls" rows="2" placeholder="https://...\nhttps://..."></textarea>
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
                <button type="button" class="btn btn-outline-secondary" id="save-draft-btn">Guardar borrador</button>
                <button type="button" class="btn btn-success" id="publish-btn">Publicar</button>
                <button type="button" class="btn btn-light" id="clear-form-btn">Limpiar</button>
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
  const categoryEl = document.getElementById('f-category');
  const descriptionEl = document.getElementById('f-description');
  const materialEl = document.getElementById('f-material');
  const sectorEl = document.getElementById('f-sector');
  const applicationEl = document.getElementById('f-application');
  const productTypeEl = document.getElementById('f-productType');
  const mainImageUrlEl = document.getElementById('f-mainImageUrl');
  const thumbnailUrlEl = document.getElementById('f-thumbnailUrl');
  const mobileImageUrlEl = document.getElementById('f-mobileImageUrl');
  const galleryUrlsEl = document.getElementById('f-galleryUrls');

  const formTitleEl = document.getElementById('form-title');
  const formModeBadgeEl = document.getElementById('form-mode-badge');

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
    selectedId = null;
    idEl.value = '';
    nameEl.value = '';
    categoryEl.value = '';
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

    formTitleEl.textContent = 'Crear ProductMaster';
    formModeBadgeEl.textContent = 'Modo: Crear';

    updateDerivedPreview();
  }

  function fillForm(product) {
    idEl.value = product.id || '';
    nameEl.value = product.name || '';
    categoryEl.value = product.category || '';
    descriptionEl.value = product.description || '';

    materialEl.value = product.managedAttributes?.material || '';
    sectorEl.value = product.managedAttributes?.sector || '';
    applicationEl.value = product.managedAttributes?.application || '';
    productTypeEl.value = product.managedAttributes?.productType || '';

    mainImageUrlEl.value = product.media?.mainImageUrl || '';
    thumbnailUrlEl.value = product.media?.thumbnailUrl || '';
    mobileImageUrlEl.value = product.media?.mobileImageUrl || '';
    galleryUrlsEl.value = (product.media?.galleryUrls || []).join('\n');

    const selectedSkuIds = new Set(product.skuIds || []);
    document.querySelectorAll('.sku-checkbox').forEach(cb => {
      cb.checked = selectedSkuIds.has(cb.value);
    });

    formTitleEl.textContent = `Editar ProductMaster: ${product.name}`;
    formModeBadgeEl.textContent = 'Modo: Editar';

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
      category: categoryEl.value.trim(),
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

  function validateFormDraft() {
    if (!nameEl.value.trim()) {
      throw new Error('Nombre es requerido.');
    }
  }

  async function saveDraft() {
    clearAlert();
    const payload = buildPayload();
    validateFormDraft();

    let saved;
    if (selectedId) {
      saved = api.updateProduct(selectedId, { ...payload, status: 'draft' });
    } else {
      saved = api.createProduct({ ...payload, status: 'draft' });
      selectedId = saved.id;
    }

    fillForm(saved);
    showAlert('Borrador guardado correctamente.', 'success');
  }

  async function publish() {
    clearAlert();
    const payload = buildPayload();
    validateFormDraft();

    let targetId = selectedId;

    if (targetId) {
      api.updateProduct(targetId, payload);
    } else {
      const created = api.createProduct(payload);
      targetId = created.id;
      selectedId = targetId;
    }

    const published = api.publishProduct(targetId);
    fillForm(api.getProductById(published.id));
    showAlert('Producto publicado correctamente.', 'success');
  }

  document.getElementById('clear-form-btn').addEventListener('click', () => {
    clearAlert();
    clearForm();
  });

  document.getElementById('save-draft-btn').addEventListener('click', async () => {
    try {
      await saveDraft();
    } catch (error) {
      showAlert(error.message);
    }
  });

  document.getElementById('publish-btn').addEventListener('click', async () => {
    try {
      await publish();
    } catch (error) {
      showAlert(error.message);
    }
  });

  document.querySelectorAll('.sku-checkbox').forEach(cb => {
    cb.addEventListener('change', updateDerivedPreview);
  });

  if (selectedId) {
    const product = api.getProductById(selectedId);
    if (product) {
      fillForm(product);
    } else {
      clearForm();
      showAlert(`No se encontro el producto ${selectedId}.`, 'warning');
    }
  } else {
    clearForm();
  }
}

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
