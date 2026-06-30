/**
 * screens/attributes.js - Administración de opciones de atributos
 * 
 * Permite gestionar las opciones maestras de cada atributo
 * (materiales, sectores, aplicaciones, tipos de productos)
 */

import { api } from '../api.js?v=20260612-17';
import { initLayout } from '../layout.js?v=20260612-17';

const ATTRIBUTES = {
  materials: { label: 'Materiales', key: 'materials' },
  sectors: { label: 'Sectores', key: 'sectors' },
  applications: { label: 'Aplicaciones', key: 'applications' },
  productTypes: { label: 'Tipos de Productos', key: 'productTypes' },
  shapes: { label: 'Formas', key: 'shapes' },
  dimensionUnits: { label: 'Unidades de Medida (Dimensiones)', key: 'dimensionUnits' },
  weightUnits: { label: 'Unidades de Medida (Peso)', key: 'weightUnits' }
};

export async function renderAttributes() {
  const layout = await initLayout({ screenCode: 'attributes', pageTitle: 'Administración de Atributos' });
  const contentEl = layout.getContentElement();

  let selectedAttribute = 'materials';
  const catalogOptions = api.getCatalogOptions();

  contentEl.innerHTML = `
    <div class="row g-4">
      <!-- Selector de atributo -->
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Selecciona un atributo para administrar</h5>
          </div>
          <div class="card-body">
            <div class="btn-group" role="group" id="attribute-selector">
              ${Object.entries(ATTRIBUTES).map(([key, attr]) => `
                <input type="radio" class="btn-check" name="attribute" id="attr-${key}" value="${key}" ${key === 'materials' ? 'checked' : ''}>
                <label class="btn btn-outline-primary" for="attr-${key}">${attr.label}</label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Editor de opciones -->
      <div class="col-12">
        <div id="alert-container"></div>
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0" id="attribute-title">Materiales</h5>
            <button class="btn btn-sm btn-success" id="add-option-btn">
              + Agregar opción
            </button>
          </div>
          <div class="card-body">
            <div id="options-list" class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th style="width: 40%">Código/Valor</th>
                    <th style="width: 40%">Descripción/Etiqueta</th>
                    <th style="width: 20%">Acciones</th>
                  </tr>
                </thead>
                <tbody id="options-tbody">
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para agregar/editar -->
      <div class="modal fade" id="option-modal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="modal-title">Agregar opción</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="option-form" class="row g-3">
                <div class="col-12">
                  <label class="form-label">Código/Valor <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="f-value" required placeholder="Ej: Bagazo">
                </div>
                <div class="col-12">
                  <label class="form-label">Descripción/Etiqueta <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="f-label" required placeholder="Ej: Bagazo de caña">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="save-option-btn">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const alertContainer = document.getElementById('alert-container');
  const optionsListEl = document.getElementById('options-tbody');
  const attributeTitleEl = document.getElementById('attribute-title');
  const attributeSelectorEl = document.getElementById('attribute-selector');
  const addOptionBtnEl = document.getElementById('add-option-btn');
  const optionFormEl = document.getElementById('option-form');
  const fValueEl = document.getElementById('f-value');
  const fLabelEl = document.getElementById('f-label');
  const saveOptionBtnEl = document.getElementById('save-option-btn');
  
  let optionModalEl = null;
  
  // Inicializar modal después de que esté disponible en el DOM
  setTimeout(() => {
    const modalElement = document.getElementById('option-modal');
    if (modalElement && typeof bootstrap !== 'undefined') {
      optionModalEl = new bootstrap.Modal(modalElement);
    }
  }, 100);

  let isEditingMode = false;
  let editingOldValue = null;

  function showAlert(message, type = 'info') {
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;
  }

  function clearAlert() {
    alertContainer.innerHTML = '';
  }

  function renderOptions() {
    const options = catalogOptions[selectedAttribute] || [];
    
    if (options.length === 0) {
      optionsListEl.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted py-3">
            No hay opciones definidas. <a href="#" id="add-first-link">Agrega una</a>.
          </td>
        </tr>
      `;
      document.getElementById('add-first-link').addEventListener('click', (e) => {
        e.preventDefault();
        openAddModal();
      });
      return;
    }

    optionsListEl.innerHTML = options.map(option => `
      <tr>
        <td><strong>${option.value}</strong></td>
        <td>${option.label}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary edit-option-btn" data-value="${option.value}">
            Editar
          </button>
          <button class="btn btn-sm btn-outline-danger delete-option-btn" data-value="${option.value}">
            Eliminar
          </button>
        </td>
      </tr>
    `).join('');

    // Listeners para editar
    optionsListEl.querySelectorAll('.edit-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        const option = options.find(opt => opt.value === value);
        openEditModal(option);
      });
    });

    // Listeners para eliminar
    optionsListEl.querySelectorAll('.delete-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (confirm(`¿Eliminar "${value}"?`)) {
          deleteOption(value);
        }
      });
    });
  }

  function openAddModal() {
    isEditingMode = false;
    editingOldValue = null;
    optionFormEl.reset();
    document.getElementById('modal-title').textContent = `Agregar opción a ${ATTRIBUTES[selectedAttribute].label}`;
    if (optionModalEl) optionModalEl.show();
  }

  function openEditModal(option) {
    isEditingMode = true;
    editingOldValue = option.value;
    fValueEl.value = option.value;
    fLabelEl.value = option.label;
    document.getElementById('modal-title').textContent = `Editar opción`;
    if (optionModalEl) optionModalEl.show();
  }

  async function saveOption() {
    const value = fValueEl.value.trim();
    const label = fLabelEl.value.trim();

    if (!value || !label) {
      showAlert('Completa todos los campos', 'warning');
      return;
    }

    try {
      if (isEditingMode) {
        api.updateAttributeOption(selectedAttribute, editingOldValue, { value, label });
        showAlert(`Opción actualizada correctamente`, 'success');
      } else {
        api.addAttributeOption(selectedAttribute, { value, label });
        showAlert(`Opción agregada correctamente`, 'success');
      }

      // Recargar opciones
      const updatedOptions = api.getCatalogOptions();
      catalogOptions[selectedAttribute] = updatedOptions[selectedAttribute];
      renderOptions();
      if (optionModalEl) optionModalEl.hide();
      clearAlert();
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'danger');
    }
  }

  async function deleteOption(value) {
    try {
      api.deleteAttributeOption(selectedAttribute, value);
      showAlert(`Opción eliminada correctamente`, 'success');

      // Recargar opciones
      const updatedOptions = api.getCatalogOptions();
      catalogOptions[selectedAttribute] = updatedOptions[selectedAttribute];
      renderOptions();
      clearAlert();
    } catch (error) {
      showAlert(`Error: ${error.message}`, 'danger');
    }
  }

  // Event listeners
  attributeSelectorEl.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
      selectedAttribute = e.target.value;
      attributeTitleEl.textContent = ATTRIBUTES[selectedAttribute].label;
      renderOptions();
      clearAlert();
    }
  });

  addOptionBtnEl.addEventListener('click', openAddModal);

  saveOptionBtnEl.addEventListener('click', saveOption);

  optionFormEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveOption();
    }
  });

  // Renderizar inicial
  renderOptions();
}
