/**
 * layout.js - Shell visual compartido entre todas las pantallas
 * 
 * Renderiza header, sidebar y navegación.
 */

export async function initLayout(options = {}) {
  const { screenCode = 'home', pageTitle = 'Producto Maestro' } = options;

  // Actualizar título
  document.title = pageTitle + ' | Producto Maestro';

  // Render shell
  const html = `
    <div class="d-flex" id="app-container" style="min-height: 100vh;">
      <!-- Sidebar -->
      <nav class="navbar navbar-dark bg-dark" style="width: 280px; min-height: 100vh;">
        <div class="container-fluid flex-column align-items-start">
          <a class="navbar-brand mb-4 mt-2" href="#/">
            <strong>📦 Producto Maestro</strong>
          </a>
          <div class="nav flex-column w-100" id="sidebar-nav">
            <a class="nav-link ${screenCode === 'catalog' ? 'active' : ''}" href="#/catalog">
              Catálogo
            </a>
            <a class="nav-link ${screenCode === 'detail' ? 'active' : ''}" href="#/detail">
              Detalle (Demo)
            </a>
            <a class="nav-link ${screenCode === 'admin' ? 'active' : ''}" href="#/admin">
              Administración
            </a>
            <small class="text-muted d-block mt-3 mb-2">Estado:</small>
            <small id="app-status" class="text-warning">Cargando...</small>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="flex-fill d-flex flex-column">
        <!-- Header -->
        <header class="bg-primary text-white py-3 px-4 border-bottom">
          <div class="d-flex justify-content-between align-items-center">
            <h1 class="h5 mb-0" id="page-title">${pageTitle}</h1>
            <button class="btn btn-sm btn-outline-light" id="reset-seed-btn" title="Restaurar datos de ejemplo">
              🔄 Reset Seed
            </button>
          </div>
        </header>

        <!-- Content Area -->
        <main class="flex-fill overflow-auto bg-light p-4" id="app-content">
          <!-- Aquí se renderizan las pantallas -->
        </main>
      </div>
    </div>
  `;

  // Insertar en el body
  document.body.innerHTML = html;

  // Styles adicionales
  const style = document.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    #app-container {
      background: #f5f5f5;
    }
    .navbar {
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
    }
    .nav-link {
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      padding: 0.5rem;
    }
    .nav-link:hover {
      color: white;
      background: rgba(255,255,255,0.1);
    }
    .nav-link.active {
      color: white;
      background: #0d6efd;
    }
    main {
      overflow-y: auto;
    }
  `;
  document.head.appendChild(style);

  // Setup reset button
  document.getElementById('reset-seed-btn').addEventListener('click', async () => {
    if (confirm('¿Restaurar datos a ejemplo original?')) {
      const { api } = await import('./api.js');
      await api.resetToSeed();
      alert('Datos restaurados. Recargando...');
      window.location.reload();
    }
  });

  // Actualizar status
  document.getElementById('app-status').textContent = 'Listo ✓';

  return {
    getContentElement: () => document.getElementById('app-content'),
    updatePageTitle: (title) => {
      document.getElementById('page-title').textContent = title;
    },
    setStatus: (text) => {
      document.getElementById('app-status').textContent = text;
    }
  };
}
