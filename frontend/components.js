/**
 * components.js - Utilidades para renderizar componentes UI comunes
 */

/**
 * Renderiza un badge de estado
 */
export function statusBadge(status) {
  const colors = {
    draft: 'warning',
    published: 'success',
    archived: 'secondary'
  };
  const labels = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado'
  };
  
  const color = colors[status] || 'secondary';
  const label = labels[status] || status;
  
  return `<span class="badge bg-${color}">${label}</span>`;
}

/**
 * Formatea un texto para mostrar atributo derivado
 */
export function formatDerivatedAttribute(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return '<em class="text-muted">—</em>';
  }
  return values.map(v => `<span class="badge bg-light text-dark">${v}</span>`).join(' ');
}

/**
 * Renderiza una tarjeta de producto
 */
export function productCard(product, clickCallback = null) {
  const { id, name, media, managedAttributes, derivedAttributes, status } = product;
  
  const imageUrl = media?.thumbnailUrl || media?.mainImageUrl || 'https://via.placeholder.com/150';
  const statusHtml = status === 'published' ? statusBadge(status) : '';
  
  let html = `
    <div class="card h-100 product-card" data-product-id="${id}" style="cursor: ${clickCallback ? 'pointer' : 'default'}; transition: transform 0.2s, box-shadow 0.2s;">
      <img src="${imageUrl}" class="card-img-top" alt="${name}" style="height: 150px; object-fit: cover;">
      <div class="card-body">
        <h6 class="card-title">${name}</h6>
        <p class="card-text" style="font-size: 0.85rem;">
          <small>${managedAttributes?.material || '—'}</small>
        </p>
        ${statusHtml}
        <div class="mt-2" style="font-size: 0.75rem;">
          <div><strong>Variantes:</strong></div>
          <div>${derivedAttributes?.colors?.length || 0} colores</div>
          <div>${derivedAttributes?.capacities?.length || 0} capacidades</div>
        </div>
      </div>
    </div>
  `;
  
  return html;
}

/**
 * Renderiza un filtro de selección múltiple
 */
export function filterCheckbox(dimensionLabel, dimensionValue, values = [], onChange = null) {
  const checkboxesHtml = values.map((val, idx) => {
    const id = `filter-${dimensionValue}-${idx}`;
    return `
      <div class="form-check">
        <input class="form-check-input filter-checkbox" type="checkbox" id="${id}" 
               data-dimension="${dimensionValue}" data-value="${val}">
        <label class="form-check-label" for="${id}">${val}</label>
      </div>
    `;
  }).join('');

  let html = `
    <div class="card mb-3">
      <div class="card-header">
        <h6 class="mb-0">${dimensionLabel}</h6>
      </div>
      <div class="card-body">
        <div class="filter-group" data-dimension="${dimensionValue}">
          ${checkboxesHtml}
        </div>
      </div>
    </div>
  `;

  // Nota: Los event listeners se agregan en la pantalla después de insertar el HTML

  return html;
}

/**
 * Renderiza la galería de imágenes
 */
export function imageGallery(product) {
  const { media } = product;
  
  if (!media || !media.galleryUrls || media.galleryUrls.length === 0) {
    return '';
  }

  const thumbsHtml = media.galleryUrls.map((url, idx) => `
    <img src="${url}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" 
         data-idx="${idx}" title="Click para ampliar">
  `).join('');

  return `
    <div class="mt-3">
      <p><strong>Galería:</strong></p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${thumbsHtml}
      </div>
    </div>
  `;
}

/**
 * Formatea texto con truncado
 */
export function truncateText(text = '', maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Renderiza un spinner de carga
 */
export function loadingSpinner() {
  return `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3 text-muted">Cargando datos...</p>
    </div>
  `;
}

/**
 * Renderiza mensaje "sin resultados"
 */
export function emptyState(message = 'No hay resultados') {
  return `
    <div class="text-center py-5 text-muted">
      <p class="h6">📭 ${message}</p>
    </div>
  `;
}
