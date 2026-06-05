/**
 * repository.js - Abstracción de localStorage
 * 
 * Carga datos iniciales desde JSON y persiste cambios del usuario en localStorage.
 */

const STORAGE_KEY = 'product-master-prototype:state';
const SCHEMA_VERSION = '1.0';

let cachedState = null;

/**
 * Carga datos desde JSON remoto (frontend/data/)
 */
async function loadSeedData() {
  try {
    const [skusRes, productsRes, optionsRes] = await Promise.all([
      fetch('./frontend/data/skus.json'),
      fetch('./frontend/data/product-masters.json'),
      fetch('./frontend/data/catalog-options.json')
    ]);

    if (!skusRes.ok || !productsRes.ok || !optionsRes.ok) {
      throw new Error('Error loading seed data');
    }

    const skus = await skusRes.json();
    const products = await productsRes.json();
    const options = await optionsRes.json();

    return { skus, products, options };
  } catch (error) {
    console.error('Failed to load seed data:', error);
    throw error;
  }
}

/**
 * Inicializa el estado desde localStorage o desde seed
 */
export async function initializeRepository() {
  // Verificar si hay datos persistidos
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    try {
      cachedState = JSON.parse(stored);
      console.log('Loaded state from localStorage');
      return cachedState;
    } catch (e) {
      console.warn('Failed to parse stored state, loading seed data instead');
    }
  }

  // Cargar desde seed
  const seedData = await loadSeedData();
  
  cachedState = {
    version: SCHEMA_VERSION,
    skus: seedData.skus,
    products: seedData.products,
    catalogOptions: seedData.options,
    lastUpdated: new Date().toISOString()
  };

  // Persistir
  saveState();
  console.log('Initialized from seed data');
  
  return cachedState;
}

/**
 * Obtiene el estado completo en caché
 */
export function getState() {
  if (!cachedState) {
    throw new Error('Repository not initialized. Call initializeRepository() first.');
  }
  return cachedState;
}

/**
 * Persiste el estado actual en localStorage
 */
function saveState() {
  if (cachedState) {
    cachedState.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
  }
}

/**
 * Obtiene todos los SKUs
 */
export function getSkus() {
  return getState().skus;
}

/**
 * Obtiene todos los ProductMasters
 */
export function getProducts() {
  return getState().products;
}

/**
 * Obtiene un ProductMaster por ID
 */
export function getProductById(id) {
  return getProducts().find(p => p.id === id);
}

/**
 * Actualiza un ProductMaster
 */
export function updateProduct(id, updates) {
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  
  if (idx === -1) {
    throw new Error(`Product ${id} not found`);
  }

  products[idx] = { ...products[idx], ...updates };
  saveState();
  
  return products[idx];
}

/**
 * Crea un nuevo ProductMaster
 */
export function createProduct(productData) {
  const products = getProducts();
  
  const newProduct = {
    id: `pm-${Date.now()}`,
    status: 'draft',
    ...productData
  };

  products.push(newProduct);
  saveState();

  return newProduct;
}

/**
 * Obtiene opciones de catálogo
 */
export function getCatalogOptions() {
  return getState().catalogOptions;
}

/**
 * Reestablece el estado a los datos seed originales
 */
export async function resetToSeed() {
  const seedData = await loadSeedData();
  
  cachedState = {
    version: SCHEMA_VERSION,
    skus: seedData.skus,
    products: seedData.products,
    catalogOptions: seedData.options,
    lastUpdated: new Date().toISOString()
  };

  saveState();
  console.log('Reset to seed data');
  
  return cachedState;
}

/**
 * Limpia todo localStorage
 */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  cachedState = null;
}
