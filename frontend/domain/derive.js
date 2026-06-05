/**
 * derive.js - Cálculo determinístico de atributos derivados desde SKUs
 * 
 * Los derivados se calculan siempre desde los SKUs. Son read-only para el usuario.
 */

/**
 * Calcula atributos derivados a partir de los SKUs asociados
 * @param {Array} skus - Array de objetos SKU con atributos.color, .size, .capacity
 * @returns {Object} Derivados normalizados y únicos
 */
export function computeDerivedAttributes(skus = []) {
  if (!Array.isArray(skus) || skus.length === 0) {
    return {
      colors: [],
      sizes: [],
      capacities: []
    };
  }

  // Extraer valores no nulos y únicos
  const colors = [...new Set(
    skus
      .map(s => s.attributes?.color)
      .filter(Boolean)
      .map(v => v.trim())
  )].sort();

  const sizes = [...new Set(
    skus
      .map(s => s.attributes?.size)
      .filter(Boolean)
      .map(v => v.trim())
  )].sort();

  const capacities = [...new Set(
    skus
      .map(s => s.attributes?.capacity)
      .filter(Boolean)
      .map(v => v.trim())
  )].sort();

  return {
    colors,
    sizes,
    capacities
  };
}

/**
 * Actualiza los derivados de un ProductMaster
 * @param {Object} productMaster - El producto
 * @param {Array} allSkus - Todos los SKUs disponibles
 * @returns {Object} ProductMaster con derivados actualizados
 */
export function enrichProductMasterWithDeriveds(productMaster, allSkus = []) {
  const skuIds = productMaster.skuIds || [];
  const skusForProduct = allSkus.filter(s => skuIds.includes(s.id));
  
  return {
    ...productMaster,
    derivedAttributes: computeDerivedAttributes(skusForProduct)
  };
}
