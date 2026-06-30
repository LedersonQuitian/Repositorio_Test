/**
 * app.js - Router y orquestación principal de la SPA
 */

import { api } from './api.js?v=20260612-17';
import { renderCatalog } from './screens/catalog.js?v=20260612-17';
import { renderDetail } from './screens/detail.js?v=20260612-17';
import { renderAdmin } from './screens/admin.js?v=20260612-17';
import { renderCreateProduct } from './screens/create-product.js?v=20260612-17';
import { renderAttributes } from './screens/attributes.js?v=20260612-17';
import { renderCategories } from './screens/categories.js?v=20260612-17';
import { renderSkuAttributes } from './screens/sku-attributes.js?v=20260612-17';

// Estado global
let isInitialized = false;

/**
 * Parsea la ruta hash
 */
function parseRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);
  
  return {
    screen: parts[0] || 'catalog',
    param: parts[1] || null
  };
}

/**
 * Renderiza la pantalla según la ruta
 */
async function renderScreen() {
  const { screen, param } = parseRoute();

  try {
    switch (screen) {
      case 'catalog':
        await renderCatalog();
        break;
      case 'detail':
        await renderDetail(param);
        break;
      case 'admin':
        await renderAdmin(param);
        break;
      case 'create-product':
        await renderCreateProduct();
        break;
      case 'attributes':
        await renderAttributes();
        break;
      case 'categories':
        await renderCategories();
        break;
      case 'sku-attributes':
        await renderSkuAttributes();
        break;
      default:
        // Redirigir a catalog
        window.location.hash = '#/catalog';
    }
  } catch (error) {
    console.error('Error rendering screen:', error);
    const content = document.getElementById('app-content');
    if (content) {
      content.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <h5>Error al cargar la pantalla</h5>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
  if (isInitialized) return;

  try {
    console.log('🔄 Inicializando app...');
    
    // Cargar datos
    console.log('📦 Cargando datos...');
    await api.initialize();
    console.log('✅ Datos cargados');
    
    isInitialized = true;

    // Renderizar pantalla inicial
    console.log('🎨 Renderizando pantalla...');
    await renderScreen();
    console.log('✅ Pantalla renderizada');

    // Escuchar cambios de ruta
    window.addEventListener('hashchange', renderScreen);
    console.log('✅ App lista');
  } catch (error) {
    console.error('❌ Error inicializando app:', error);
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          <h4>Error al inicializar la aplicación</h4>
          <p><strong>${error.message}</strong></p>
          <pre>${error.stack}</pre>
          <p>Revisa la consola del navegador (F12) para más detalles.</p>
        </div>
      </div>
    `;
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
