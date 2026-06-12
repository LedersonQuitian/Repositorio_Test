/**
 * screens/detail.js - Pantalla de detalle de ProductMaster
 */

import { api } from '../api.js?v=20260612-2';
import { initLayout } from '../layout.js?v=20260612-2';
import * as components from '../components.js?v=20260612-2';

export async function renderDetail(productId = null) {
  const layout = await initLayout({ screenCode: 'detail', pageTitle: 'Detalle del Producto' });
  const contentEl = layout.getContentElement();

  // Si no hay productId, mostrar lista para seleccionar
  if (!productId) {
    return renderProductList(contentEl, layout);
  }

  // Cargar producto
  const product = api.getProductById(productId);

  if (!product) {
    contentEl.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Producto no encontrado
      </div>
      <a href="#/detail" class="btn btn-secondary">Volver</a>
    `;
    return;
  }

  layout.updatePageTitle(`Detalle: ${product.name}`);

  // Renderizar detalle
  const html = `
    <div class="row">
      <!-- Columna de imagen -->
      <div class="col-lg-6">
        <div class="sticky-top">
          <img id="main-image" src="${product.media?.mainImageUrl}" class="img-fluid rounded" 
               alt="${product.name}" style="max-height: 400px; object-fit: cover;">
          
          ${components.imageGallery(product)}
        </div>
      </div>

      <!-- Columna de información -->
      <div class="col-lg-6">
        <div>
          <h2>${product.name}</h2>
          <div class="mb-3">
            ${components.statusBadge(product.status)}
          </div>

          <p class="lead">${product.description || 'Sin descripción'}</p>

          <!-- Atributos gestionados -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Características</h5>
            </div>
            <div class="card-body">
              <dl class="row">
                <dt class="col-sm-3">Material:</dt>
                <dd class="col-sm-9"><strong>${product.managedAttributes?.material || '—'}</strong></dd>

                <dt class="col-sm-3">Sector:</dt>
                <dd class="col-sm-9"><strong>${product.managedAttributes?.sector || '—'}</strong></dd>

                <dt class="col-sm-3">Aplicación:</dt>
                <dd class="col-sm-9"><strong>${product.managedAttributes?.application || '—'}</strong></dd>

                <dt class="col-sm-3">Tipo:</dt>
                <dd class="col-sm-9"><strong>${product.managedAttributes?.productType || '—'}</strong></dd>
              </dl>
            </div>
          </div>

          <!-- Variantes derivadas -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Variantes disponibles</h5>
            </div>
            <div class="card-body">
              <p class="small text-muted mb-3">Las variantes se calculan automáticamente desde las opciones técnicas disponibles.</p>
              
              ${product.derivedAttributes?.colors?.length > 0 ? `
                <div class="mb-3">
                  <strong>Colores:</strong><br>
                  ${components.formatDerivatedAttribute(product.derivedAttributes.colors)}
                </div>
              ` : ''}

              ${product.derivedAttributes?.capacities?.length > 0 ? `
                <div class="mb-3">
                  <strong>Capacidades:</strong><br>
                  ${components.formatDerivatedAttribute(product.derivedAttributes.capacities)}
                </div>
              ` : ''}

              ${product.derivedAttributes?.sizes?.length > 0 ? `
                <div class="mb-3">
                  <strong>Tamaños:</strong><br>
                  ${components.formatDerivatedAttribute(product.derivedAttributes.sizes)}
                </div>
              ` : ''}

              ${(!product.derivedAttributes?.colors?.length && !product.derivedAttributes?.capacities?.length && !product.derivedAttributes?.sizes?.length) ? `
                <p class="text-muted small">No hay variantes disponibles para este producto.</p>
              ` : ''}
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="d-flex gap-2 mb-4">
            <a href="#/detail" class="btn btn-outline-secondary">← Volver</a>
            <a href="#/catalog" class="btn btn-primary">Ver catálogo</a>
            <a href="#/admin/${product.id}" class="btn btn-warning">Editar producto</a>
          </div>
        </div>
      </div>
    </div>
  `;

  contentEl.innerHTML = html;

  // Setup image gallery
  const thumbnails = contentEl.querySelectorAll('img[data-idx]');
  const mainImage = contentEl.querySelector('#main-image');
  
  if (product.media?.galleryUrls) {
    thumbnails.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        mainImage.src = product.media.galleryUrls[idx];
        mainImage.classList.add('animate__animated', 'animate__fadeIn');
        setTimeout(() => {
          mainImage.classList.remove('animate__animated', 'animate__fadeIn');
        }, 300);
      });
    });
  }
}

/**
 * Renderiza lista de productos para seleccionar detalle
 */
async function renderProductList(contentEl, layout) {
  layout.updatePageTitle('Seleccionar Producto');

  const products = api.getPublishedProducts();

  if (products.length === 0) {
    contentEl.innerHTML = `
      <div class="alert alert-info">
        No hay productos publicados. <a href="#/catalog">Ir al catálogo</a>
      </div>
    `;
    return;
  }

  let html = `
    <h4 class="mb-4">Selecciona un producto para ver el detalle</h4>
    <div class="row g-3">
  `;

  products.forEach(product => {
    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 border-0 bg-transparent">
          <a href="#/detail/${product.id}" style="text-decoration: none; color: inherit;">
            ${components.productCard(product)}
          </a>
          <div class="d-flex gap-2 mt-2">
            <a href="#/detail/${product.id}" class="btn btn-sm btn-outline-primary">Ver detalle</a>
            <a href="#/admin/${product.id}" class="btn btn-sm btn-warning">Editar</a>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  contentEl.innerHTML = html;

  // Add hover effects
  contentEl.querySelectorAll('.product-card').forEach(card => {
    card.style.cursor = 'pointer';
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
