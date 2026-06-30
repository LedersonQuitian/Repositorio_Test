/**
 * repository.js - Abstracción de localStorage
 * 
 * Carga datos iniciales desde JSON y persiste cambios del usuario en localStorage.
 */

const STORAGE_KEY = 'product-master-prototype:state';
const SCHEMA_VERSION = '1.0';
console.log('aqui estuvo Sebastián');

let cachedState = null;

/**
 * Carga datos desde JSON remoto (frontend/data/)
 */
async function loadSeedData() {
  try {
    const [skusRes, productsRes, optionsRes] = await Promise.all([
      fetch('/frontend/data/skus.json'),
      fetch('/frontend/data/product-masters.json'),
      fetch('/frontend/data/catalog-options.json')
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
  // Cargar siempre los datos seed (para tener los atributos más actualizados)
  const seedData = await loadSeedData();

  // Verificar si hay datos persistidos
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (stored) {
    try {
      const storedState = JSON.parse(stored);
      
      // Hacer merge: usar datos guardados pero actualizar catalogOptions con los nuevos atributos
      cachedState = {
        version: SCHEMA_VERSION,
        skus: storedState.skus || seedData.skus,
        products: storedState.products || seedData.products,
        catalogOptions: {
          ...storedState.catalogOptions,
          ...seedData.options  // Merge: nuevos atributos sobrescriben los antiguos
        },
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Loaded state from localStorage with updated catalog options');
      saveState();
      return cachedState;
    } catch (e) {
      console.warn('Failed to parse stored state, loading seed data instead');
    }
  }

  // Cargar desde seed
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
 * Obtiene un SKU por ID
 */
export function getSkuById(id) {
  return getSkus().find(sku => sku.id === id);
}

/**
 * Obtiene un SKU por código
 */
export function getSkuByCode(code) {
  return getSkus().find(sku => sku.code === code);
}

/**
 * Actualiza los atributos de un SKU
 */
export function updateSkuAttributes(skuId, attributeUpdates) {
  const skus = getSkus();
  const sku = skus.find(s => s.id === skuId);
  
  if (!sku) {
    throw new Error(`SKU ${skuId} not found`);
  }
  
  sku.attributes = {
    ...sku.attributes,
    ...attributeUpdates
  };
  
  saveState();
  return sku;
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

  // ID es inmutable una vez creado.
  const { id: _ignoredId, ...safeUpdates } = updates || {};
  products[idx] = { ...products[idx], ...safeUpdates, id: products[idx].id };
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
 * Agrega una nueva opción a un atributo
 */
export function addAttributeOption(attributeName, optionData) {
  const options = getState().catalogOptions;
  
  if (!options[attributeName]) {
    throw new Error(`Atributo ${attributeName} no existe`);
  }

  const newOption = {
    value: optionData.value,
    label: optionData.label || optionData.value
  };

  // Evitar duplicados
  if (options[attributeName].some(opt => opt.value === newOption.value)) {
    throw new Error(`Opción ${newOption.value} ya existe`);
  }

  options[attributeName].push(newOption);
  saveState();
  
  return newOption;
}

/**
 * Actualiza una opción de atributo
 */
export function updateAttributeOption(attributeName, oldValue, newOptionData) {
  const options = getState().catalogOptions;
  
  if (!options[attributeName]) {
    throw new Error(`Atributo ${attributeName} no existe`);
  }

  const idx = options[attributeName].findIndex(opt => opt.value === oldValue);
  if (idx === -1) {
    throw new Error(`Opción ${oldValue} no encontrada`);
  }

  options[attributeName][idx] = {
    value: newOptionData.value,
    label: newOptionData.label || newOptionData.value
  };
  
  saveState();
  return options[attributeName][idx];
}

/**
 * Elimina una opción de atributo
 */
export function deleteAttributeOption(attributeName, value) {
  const options = getState().catalogOptions;
  
  if (!options[attributeName]) {
    throw new Error(`Atributo ${attributeName} no existe`);
  }

  const idx = options[attributeName].findIndex(opt => opt.value === value);
  if (idx === -1) {
    throw new Error(`Opción ${value} no encontrada`);
  }

  options[attributeName].splice(idx, 1);
  saveState();
}

/**
 * Obtiene todas las categorías (array plano)
 */
export function getAllCategories() {
  const options = getState().catalogOptions;
  return options.categories || [];
}

/**
 * Obtiene categorías raíz (nivel 0)
 */
export function getRootCategories() {
  const all = getAllCategories();
  return all.filter(cat => cat.level === 0).sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Obtiene una categoría por ID
 */
export function getCategoryById(categoryId) {
  const all = getAllCategories();
  return all.find(cat => cat.id === categoryId);
}

/**
 * Obtiene categorías hijas (relacionadas como padre)
 */
export function getChildCategories(parentId, level) {
  const all = getAllCategories();
  // Si se especifica nivel, devolver categorías de ese nivel que tengan parentId como padre
  if (level !== undefined) {
    return all.filter(cat => 
      cat.level === level && 
      cat.parentIds && 
      cat.parentIds.includes(parentId)
    ).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  // Si no, devolver todas las categorías que tengan parentId como padre (siguiente nivel)
  return all.filter(cat => 
    cat.parentIds && 
    cat.parentIds.includes(parentId)
  ).sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Obtiene categorías padres de una categoría
 */
export function getParentCategories(categoryId) {
  const all = getAllCategories();
  const category = all.find(cat => cat.id === categoryId);
  if (!category || !category.parentIds) return [];
  return all.filter(cat => category.parentIds.includes(cat.id))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Agrega una nueva categoría
 */
export function addCategory(categoryData) {
  const options = getState().catalogOptions;
  if (!options.categories) {
    options.categories = [];
  }

  const newCategory = {
    id: `cat-${categoryData.level}-${Date.now()}`,
    code: categoryData.code || '',
    label: categoryData.label || '',
    level: categoryData.level || 0,
    description: categoryData.description || '',
    longDescription: categoryData.longDescription || '',
    externalCode: categoryData.externalCode || '',
    order: categoryData.order || 0,
    mainImageUrl: categoryData.mainImageUrl || '',
    mobileImageUrl: categoryData.mobileImageUrl || '',
    parentIds: categoryData.parentIds || []
  };

  options.categories.push(newCategory);
  saveState();
  return newCategory;
}

/**
 * Actualiza una categoría
 */
export function updateCategory(categoryId, updates) {
  const options = getState().catalogOptions;
  const all = options.categories || [];
  
  const idx = all.findIndex(cat => cat.id === categoryId);
  if (idx === -1) {
    throw new Error(`Categoría ${categoryId} no encontrada`);
  }
  
  all[idx] = { ...all[idx], ...updates };
  saveState();
  return all[idx];
}

/**
 * Elimina una categoría y ajusta sus referencias
 */
export function deleteCategory(categoryId) {
  const options = getState().catalogOptions;
  const all = options.categories || [];
  
  const idx = all.findIndex(cat => cat.id === categoryId);
  if (idx === -1) {
    throw new Error(`Categoría ${categoryId} no encontrada`);
  }
  
  // Remover de parentIds en otras categorías
  for (const cat of all) {
    if (cat.parentIds) {
      cat.parentIds = cat.parentIds.filter(pid => pid !== categoryId);
    }
  }
  
  // Eliminar la categoría
  all.splice(idx, 1);
  saveState();
}

/**
 * Agrega una relación padre-hijo (para categorías con relaciones muchos a muchos)
 */
export function addCategoryParent(categoryId, parentId) {
  const options = getState().catalogOptions;
  const all = options.categories || [];
  
  const category = all.find(cat => cat.id === categoryId);
  if (!category) {
    throw new Error(`Categoría ${categoryId} no encontrada`);
  }
  
  if (!category.parentIds) category.parentIds = [];
  if (!category.parentIds.includes(parentId)) {
    category.parentIds.push(parentId);
  }
  
  saveState();
}

/**
 * Remueve una relación padre-hijo
 */
export function removeCategoryParent(categoryId, parentId) {
  const options = getState().catalogOptions;
  const all = options.categories || [];
  
  const category = all.find(cat => cat.id === categoryId);
  if (!category || !category.parentIds) {
    return;
  }
  
  category.parentIds = category.parentIds.filter(pid => pid !== parentId);
  saveState();
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
