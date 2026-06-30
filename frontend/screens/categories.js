/**
 * screens/categories.js - Administración de Categorías (v11)
 */

import { api } from '../api.js?v=20260612-17';
import { initLayout } from '../layout.js?v=20260612-17';

export async function renderCategories() {
  const layout = await initLayout({ screenCode: 'categories', pageTitle: 'Administración de Categorías' });
  const contentEl = layout.getContentElement();

  let currentView = 'browse';
  let currentCategoryId = null;
  let expandedChildren = {};
  let searchQuery = '';

  function filterCategories(categories, query) {
    if (!query.trim()) return categories;
    
    const q = query.toLowerCase();
    return categories.filter(cat => 
      cat.code.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q)) ||
      (cat.longDescription && cat.longDescription.toLowerCase().includes(q))
    );
  }

  function renderBrowseView() {
    const allRoots = api.getRootCategories();
    const roots = filterCategories(allRoots, searchQuery);
    return `
      <div class="row g-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Categorías Principales</h4>
            <button class="btn btn-success btn-sm btn-add-new">+ Nueva Categoría Principal</button>
          </div>
        </div>
        <div class="col-12">
          <div class="input-group">
            <span class="input-group-text">🔍</span>
            <input type="text" class="form-control search-input" placeholder="Buscar por código o descripción..." value="${searchQuery}">
          </div>
        </div>
        ${roots.length === 0 ? `<div class="col-12"><div class="alert alert-info">${searchQuery ? 'No se encontraron resultados' : 'No hay categorías. Crea una nueva.'}</div></div>` : ''}
        ${roots.map(cat => `
          <div class="col-md-6 col-lg-4">
            <div class="card cursor-pointer h-100" style="cursor: pointer; transition: all 0.2s;" data-cat-id="${cat.id}">
              ${cat.mainImageUrl ? `<img src="${cat.mainImageUrl}" class="card-img-top" alt="${cat.label}" style="height: 180px; object-fit: cover;">` : '<div class="bg-light d-flex align-items-center justify-content-center" style="height: 180px;"><span class="text-muted">Sin imagen</span></div>'}
              <div class="card-body">
                <h5 class="card-title">${cat.label}</h5>
                ${cat.description ? `<p class="card-text text-muted small">${cat.description}</p>` : ''}
                <div class="d-flex gap-2 flex-wrap">
                  <span class="badge bg-primary">Nivel 0</span>
                  ${cat.externalCode ? `<span class="badge bg-info">${cat.externalCode}</span>` : ''}
                </div>
              </div>
              <div class="card-footer bg-transparent">
                <small class="text-muted">Click para editar →</small>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderDetailView(categoryId) {
    const category = api.getCategoryById(categoryId);
    if (!category) return '<div class="alert alert-danger">Categoría no encontrada</div>';

    const children = api.getChildCategories(categoryId, category.level + 1);
    const isExpanded = expandedChildren[categoryId] || false;
    const displayChildren = isExpanded ? children : children.slice(0, 3);
    const hasMore = children.length > 3 && !isExpanded;

    return `
      <div class="row g-4">
        <div class="col-12">
          <button class="btn btn-outline-secondary btn-sm btn-back">← Volver</button>
        </div>
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header bg-primary text-white"><h5 class="mb-0">Información</h5></div>
            <div class="card-body">
              ${category.mainImageUrl ? `<div class="mb-3"><img src="${category.mainImageUrl}" class="img-fluid rounded" alt="${category.label}" style="max-height: 200px; width: 100%; object-fit: cover;"></div>` : ''}
              <div class="mb-3">
                <label class="form-label fw-bold">Etiqueta</label>
                <p class="form-control-plaintext">${category.label}</p>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Código</label>
                  <p class="form-control-plaintext"><code>${category.code}</code></p>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label fw-bold">Nivel</label>
                  <p class="form-control-plaintext">${category.level}</p>
                </div>
              </div>
              <div class="d-flex gap-2 mt-4">
                <button class="btn btn-primary btn-sm btn-edit-cat" data-id="${categoryId}">✏️ Editar</button>
                <button class="btn btn-danger btn-sm btn-delete-cat" data-id="${categoryId}">🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          ${children.length > 0 ? `
            <div class="card">
              <div class="card-header bg-success text-white"><h6 class="mb-0">Nivel ${category.level + 1} (${children.length})</h6></div>
              <div class="card-body">
                <div class="list-group">
                  ${displayChildren.map(child => `
                    <div class="list-group-item d-flex justify-content-between align-items-start cursor-pointer" style="cursor: pointer;" data-child-id="${child.id}">
                      <div>
                        <strong>${child.label}</strong>
                        <br><small class="text-muted">${child.description || '-'}</small>
                      </div>
                      <span class="badge bg-secondary">→</span>
                    </div>
                  `).join('')}
                </div>
                ${hasMore ? `<button class="btn btn-sm btn-outline-primary w-100 mt-3 btn-expand">Ver todas (${children.length})</button>` : ''}
                <button class="btn btn-sm btn-success w-100 mt-2 btn-add-child" data-parent-id="${categoryId}" data-level="${category.level + 1}">+ Agregar Nivel ${category.level + 1}</button>
              </div>
            </div>
          ` : `<div class="alert alert-info">No hay subcategorías. <button class="btn btn-sm btn-success btn-add-child" data-parent-id="${categoryId}" data-level="${category.level + 1}">Crear primera</button></div>`}
        </div>
      </div>
    `;
  }

  function render(view = currentView, categoryId = currentCategoryId) {
    currentView = view;
    currentCategoryId = categoryId;
    contentEl.innerHTML = view === 'browse' ? renderBrowseView() : renderDetailView(categoryId);
    attachEventListeners();
  }

  function attachEventListeners() {
    if (currentView === 'browse') {
      contentEl.querySelectorAll('[data-cat-id]').forEach(card => {
        card.addEventListener('click', () => render('detail', card.dataset.catId));
      });

      const addBtn = contentEl.querySelector('.btn-add-new');
      if (addBtn) {
        addBtn.addEventListener('click', () => openAddModal(0, null));
      }

      const searchInput = contentEl.querySelector('.search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          render('browse');
        });
      }
    } else if (currentView === 'detail') {
      const backBtn = contentEl.querySelector('.btn-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => render('browse'));
      }

      const editBtn = contentEl.querySelector('.btn-edit-cat');
      if (editBtn) {
        editBtn.addEventListener('click', () => openEditModal(editBtn.dataset.id));
      }

      const deleteBtn = contentEl.querySelector('.btn-delete-cat');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const cat = api.getCategoryById(deleteBtn.dataset.id);
          if (confirm(`¿Eliminar "${cat.label}"?`)) {
            api.deleteCategory(deleteBtn.dataset.id);
            showAlert('Categoría eliminada', 'success');
            render('browse');
          }
        });
      }

      const expandBtn = contentEl.querySelector('.btn-expand');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          expandedChildren[currentCategoryId] = !expandedChildren[currentCategoryId];
          render('detail', currentCategoryId);
        });
      }

      contentEl.querySelectorAll('[data-child-id]').forEach(item => {
        item.addEventListener('click', () => render('detail', item.dataset.childId));
      });

      const addChildBtn = contentEl.querySelector('.btn-add-child');
      if (addChildBtn) {
        addChildBtn.addEventListener('click', () => {
          openAddModal(parseInt(addChildBtn.dataset.level), addChildBtn.dataset.parentId);
        });
      }
    }
  }

  function openAddModal(level, parentId) {
    const modal = document.createElement('div');
    const modalId = `modal-add-${Date.now()}`;
    
    modal.innerHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Agregar Categoría - Nivel ${level}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label class="form-label">Código <span class="text-danger">*</span></label>
                  <input type="text" class="form-control input-code" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Etiqueta <span class="text-danger">*</span></label>
                  <input type="text" class="form-control input-label" required>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Código Externo</label>
                    <input type="text" class="form-control input-ext-code">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Orden</label>
                    <input type="number" class="form-control input-order" value="0">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <input type="text" class="form-control input-desc">
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción Larga</label>
                  <textarea class="form-control input-long-desc" rows="2"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">URL Imagen Principal</label>
                  <input type="url" class="form-control input-img">
                </div>
                <div class="mb-3">
                  <label class="form-label">URL Imagen Móvil</label>
                  <input type="url" class="form-control input-img-mobile">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary btn-save-add">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const bs = new bootstrap.Modal(modal.querySelector('.modal'));

    modal.querySelector('.btn-save-add').addEventListener('click', () => {
      const code = modal.querySelector('.input-code').value.trim();
      const label = modal.querySelector('.input-label').value.trim();

      if (!code || !label) {
        alert('Completa código y etiqueta');
        return;
      }

      try {
        api.addCategory({
          code,
          label,
          level,
          externalCode: modal.querySelector('.input-ext-code').value.trim(),
          order: parseInt(modal.querySelector('.input-order').value) || 0,
          description: modal.querySelector('.input-desc').value.trim(),
          longDescription: modal.querySelector('.input-long-desc').value.trim(),
          mainImageUrl: modal.querySelector('.input-img').value.trim(),
          mobileImageUrl: modal.querySelector('.input-img-mobile').value.trim(),
          parentIds: level > 0 ? [parentId] : []
        });

        bs.hide();
        setTimeout(() => modal.remove(), 300);
        showAlert('Categoría agregada', 'success');
        render(currentView, currentCategoryId);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });

    bs.show();
  }

  function openEditModal(categoryId) {
    const category = api.getCategoryById(categoryId);
    if (!category) return;

    const modal = document.createElement('div');
    const modalId = `modal-edit-${Date.now()}`;

    modal.innerHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Editar Categoría</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label class="form-label">Código <span class="text-danger">*</span></label>
                  <input type="text" class="form-control input-code" value="${category.code}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Etiqueta <span class="text-danger">*</span></label>
                  <input type="text" class="form-control input-label" value="${category.label}" required>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Código Externo</label>
                    <input type="text" class="form-control input-ext-code" value="${category.externalCode || ''}">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label class="form-label">Orden</label>
                    <input type="number" class="form-control input-order" value="${category.order || 0}">
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción</label>
                  <input type="text" class="form-control input-desc" value="${category.description || ''}">
                </div>
                <div class="mb-3">
                  <label class="form-label">Descripción Larga</label>
                  <textarea class="form-control input-long-desc" rows="2">${category.longDescription || ''}</textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">URL Imagen Principal</label>
                  <input type="url" class="form-control input-img" value="${category.mainImageUrl || ''}">
                </div>
                <div class="mb-3">
                  <label class="form-label">URL Imagen Móvil</label>
                  <input type="url" class="form-control input-img-mobile" value="${category.mobileImageUrl || ''}">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary btn-save-edit">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const bs = new bootstrap.Modal(modal.querySelector('.modal'));

    modal.querySelector('.btn-save-edit').addEventListener('click', () => {
      const code = modal.querySelector('.input-code').value.trim();
      const label = modal.querySelector('.input-label').value.trim();

      if (!code || !label) {
        alert('Completa código y etiqueta');
        return;
      }

      try {
        api.updateCategory(categoryId, {
          code,
          label,
          externalCode: modal.querySelector('.input-ext-code').value.trim(),
          order: parseInt(modal.querySelector('.input-order').value) || 0,
          description: modal.querySelector('.input-desc').value.trim(),
          longDescription: modal.querySelector('.input-long-desc').value.trim(),
          mainImageUrl: modal.querySelector('.input-img').value.trim(),
          mobileImageUrl: modal.querySelector('.input-img-mobile').value.trim()
        });

        bs.hide();
        setTimeout(() => modal.remove(), 300);
        showAlert('Categoría actualizada', 'success');
        render('detail', categoryId);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });

    bs.show();
  }

  function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    contentEl.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  render('browse');
}
