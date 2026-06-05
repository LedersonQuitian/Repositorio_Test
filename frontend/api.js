/**
 * api.js - Capa de acceso a datos
 * 
 * Encapsula toda interacción con el repositorio.
 * Nunca se accede directamente a repository desde las pantallas.
 */

import * as repo from './data/repository.js';
import * as derive from './domain/derive.js';
import * as filters from './domain/filters.js';
import * as rules from './domain/rules.js';

export const api = {
  
  /**
   * Inicializa el repositorio
   */
  initialize: async () => {
    return repo.initializeRepository();
  },

  /**
   * Obtiene todos los ProductMasters enriquecidos con derivados
   */
  getAllProducts: () => {
    const products = repo.getProducts();
    const skus = repo.getSkus();
    return products.map(p => derive.enrichProductMasterWithDeriveds(p, skus));
  },

  /**
   * Obtiene un ProductMaster por ID con derivados
   */
  getProductById: (id) => {
    const product = repo.getProductById(id);
    if (!product) return null;
    
    const skus = repo.getSkus();
    return derive.enrichProductMasterWithDeriveds(product, skus);
  },

  /**
   * Obtiene todos los ProductMasters publicados
   */
  getPublishedProducts: () => {
    const products = repo.getProducts();
    const skus = repo.getSkus();
    return products
      .filter(p => p.status === 'published')
      .map(p => derive.enrichProductMasterWithDeriveds(p, skus));
  },

  /**
   * Filtra ProductMasters según criterios
   */
  filterProducts: (filterCriteria) => {
    const products = api.getPublishedProducts();
    return filters.filterProducts(products, filterCriteria);
  },

  /**
   * Obtiene valores únicos para una dimensión de filtro
   */
  getFilterOptions: (dimension) => {
    const products = api.getPublishedProducts();
    return filters.getUniqueValuesForDimension(products, dimension);
  },

  /**
   * Obtiene opciones predefinidas de catálogo
   */
  getCatalogOptions: () => {
    return repo.getCatalogOptions();
  },

  /**
   * Obtiene todos los SKUs
   */
  getSkus: () => {
    return repo.getSkus();
  },

  /**
   * Crea un nuevo ProductMaster
   */
  createProduct: (productData) => {
    const validation = rules.validateBasic(productData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    const created = repo.createProduct(productData);
    const skus = repo.getSkus();
    return derive.enrichProductMasterWithDeriveds(created, skus);
  },

  /**
   * Actualiza un ProductMaster
   */
  updateProduct: (id, updates) => {
    const updated = repo.updateProduct(id, updates);
    const skus = repo.getSkus();
    return derive.enrichProductMasterWithDeriveds(updated, skus);
  },

  /**
   * Publica un ProductMaster (cambiar estado a 'published')
   */
  publishProduct: (id) => {
    const product = repo.getProductById(id);
    if (!product) throw new Error(`Product ${id} not found`);

    const skus = repo.getSkus();
    const validation = rules.validatePublishable(product, skus);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    return repo.updateProduct(id, { status: 'published' });
  },

  /**
   * Reestablece los datos a seed
   */
  resetToSeed: async () => {
    return repo.resetToSeed();
  }
};
