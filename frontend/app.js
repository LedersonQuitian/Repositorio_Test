/**
 * app.js - Router y orquestación principal de la SPA
 */

import { api } from './api.js?v=20260612-6';
import { renderCatalog } from './screens/catalog.js?v=20260612-6';
import { renderDetail } from './screens/detail.js?v=20260612-6';
import { renderAdmin } from './screens/admin.js?v=20260612-6';

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
    // Cargar datos
    await api.initialize();
    isInitialized = true;

    // Renderizar pantalla inicial
    await renderScreen();

    // Escuchar cambios de ruta
    window.addEventListener('hashchange', renderScreen);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger" role="alert">
          <h4>Error al inicializar la aplicación</h4>
          <p>${error.message}</p>
          <p>Asegúrate de que los archivos de datos están en la carpeta frontend/data/</p>
        </div>
      </div>
    `;
  }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initApp);

// Si el DOM ya está listo (en algunas circunstancias)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
