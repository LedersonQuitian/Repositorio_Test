/**
 * api.js - Capa de acceso a datos
 * 
 * Encapsula toda interacción con el repositorio.
 * Nunca se accede directamente a repository desde las pantallas.
 */

import * as repo from './data/repository.js?v=20260612-14';
import * as derive from './domain/derive.js?v=20260612-14';
import * as filters from './domain/filters.js?v=20260612-14';
import * as rules from './domain/rules.js?v=20260612-14';

function normalizeSkuIds(skuIds = []) {
  if (!Array.isArray(skuIds)) {
    return [];
  }
  return [...new Set(skuIds.filter(Boolean))];
}

function ensureSkuCardinality(skuIds = [], productIdToIgnore = null) {
  const requestedIds = normalizeSkuIds(skuIds);
  if (requestedIds.length === 0) {
    return;
  }

  const ownerBySku = new Map();
  repo.getProducts().forEach(product => {
    if (productIdToIgnore && product.id === productIdToIgnore) {
      return;
    }

    (product.skuIds || []).forEach(skuId => {
      ownerBySku.set(skuId, product.id);
    });
  });

  const conflicts = requestedIds.filter(skuId => ownerBySku.has(skuId));
  if (conflicts.length > 0) {
    const conflictMessages = conflicts.map(skuId => `SKU ${skuId} ya pertenece a ${ownerBySku.get(skuId)}`);
    throw new Error(conflictMessages.join('; '));
  }
}

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
    const payload = {
      ...productData,
      skuIds: normalizeSkuIds(productData?.skuIds)
    };

    const validation = rules.validateBasic(payload);
    const managedValidation = rules.validateManagedAttributes(payload.managedAttributes);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }
    if (!managedValidation.isValid) {
      throw new Error(managedValidation.errors.join('; '));
    }

    ensureSkuCardinality(payload.skuIds);

    const created = repo.createProduct(payload);
    const skus = repo.getSkus();
    return derive.enrichProductMasterWithDeriveds(created, skus);
  },

  /**
   * Actualiza un ProductMaster
   */
  updateProduct: (id, updates) => {
    const current = repo.getProductById(id);
    if (!current) {
      throw new Error(`Product ${id} not found`);
    }

    const merged = {
      ...current,
      ...updates,
      id: current.id,
      skuIds: normalizeSkuIds(updates?.skuIds ?? current.skuIds)
    };

    const validation = rules.validateBasic(merged);
    const managedValidation = rules.validateManagedAttributes(merged.managedAttributes);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }
    if (!managedValidation.isValid) {
      throw new Error(managedValidation.errors.join('; '));
    }

    ensureSkuCardinality(merged.skuIds, current.id);

    const updated = repo.updateProduct(id, merged);
    const skus = repo.getSkus();
    return derive.enrichProductMasterWithDeriveds(updated, skus);
  },

  /**
   * Publica un ProductMaster (cambiar estado a 'published')
   */
  publishProduct: (id) => {
    const product = repo.getProductById(id);
    if (!product) throw new Error(`Product ${id} not found`);

    ensureSkuCardinality(product.skuIds || [], id);

    const skus = repo.getSkus();
    const validation = rules.validatePublishable(product, skus);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join('; '));
    }

    return repo.updateProduct(id, { status: 'published' });
  },

  /**
   * Obtiene opciones de catálogo (atributos y sus opciones)
   */
  getCatalogOptions: () => {
    return repo.getCatalogOptions();
  },

  /**
   * Agrega una nueva opción a un atributo
   */
  addAttributeOption: (attributeName, optionData) => {
    return repo.addAttributeOption(attributeName, optionData);
  },

  /**
   * Actualiza una opción de atributo
   */
  updateAttributeOption: (attributeName, oldValue, newOptionData) => {
    return repo.updateAttributeOption(attributeName, oldValue, newOptionData);
  },

  /**
   * Elimina una opción de atributo
   */
  deleteAttributeOption: (attributeName, value) => {
    return repo.deleteAttributeOption(attributeName, value);
  },

  /**
   * Obtiene todas las categorías (array plano)
   */
  getAllCategories: () => {
    return repo.getAllCategories();
  },

  /**
   * Obtiene categorías raíz (nivel 0)
   */
  getRootCategories: () => {
    return repo.getRootCategories();
  },

  /**
   * Obtiene una categoría por ID
   */
  getCategoryById: (categoryId) => {
    return repo.getCategoryById(categoryId);
  },

  /**
   * Obtiene categorías hijas de un padre
   */
  getChildCategories: (parentId, level) => {
    return repo.getChildCategories(parentId, level);
  },

  /**
   * Obtiene categorías padres de una categoría
   */
  getParentCategories: (categoryId) => {
    return repo.getParentCategories(categoryId);
  },

  /**
   * Agrega una nueva categoría
   */
  addCategory: (categoryData) => {
    return repo.addCategory(categoryData);
  },

  /**
   * Actualiza una categoría
   */
  updateCategory: (categoryId, updates) => {
    return repo.updateCategory(categoryId, updates);
  },

  /**
   * Elimina una categoría
   */
  deleteCategory: (categoryId) => {
    return repo.deleteCategory(categoryId);
  },

  /**
   * Agrega una relación padre-hijo
   */
  addCategoryParent: (categoryId, parentId) => {
    return repo.addCategoryParent(categoryId, parentId);
  },

  /**
   * Remueve una relación padre-hijo
   */
  removeCategoryParent: (categoryId, parentId) => {
    return repo.removeCategoryParent(categoryId, parentId);
  },

  /**
   * Reestablece los datos a seed
   */
  resetToSeed: async () => {
    return repo.resetToSeed();
  }
};
