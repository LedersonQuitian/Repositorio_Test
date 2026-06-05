/**
 * filters.js - Motor de matching para catálogo
 * 
 * Regla: AND entre dimensiones, OR dentro de la misma dimensión
 * Ejemplo:
 *   - (material=Bagazo) AND (sector=Alimentos)
 *   - (color=Negro OR Blanco) AND (capacity=500ml)
 */

/**
 * Aplica filtros a una lista de ProductMasters
 * 
 * @param {Array} products - Array de ProductMaster con derivedAttributes
 * @param {Object} filters - Objeto con claves = dimensión, valores = array de valores seleccionados
 *   Ejemplo: { material: ['Bagazo'], sector: ['Alimentos'] }
 * @returns {Array} ProductMasters que coinciden con los filtros
 */
export function filterProducts(products = [], filters = {}) {
  if (!Array.isArray(products)) return [];
  
  // Si no hay filtros, devolver todos
  const hasFilters = Object.values(filters).some(arr => arr && arr.length > 0);
  if (!hasFilters) {
    return products;
  }

  return products.filter(product => {
    // Iterar cada dimensión de filtro
    for (const [dimension, selectedValues] of Object.entries(filters)) {
      // Si no hay valores seleccionados en esta dimensión, no restringe (continua)
      if (!selectedValues || selectedValues.length === 0) {
        continue;
      }

      // Buscar el valor del producto en esta dimensión
      let productValue = null;

      if (dimension === 'material') {
        productValue = product.managedAttributes?.material;
      } else if (dimension === 'sector') {
        productValue = product.managedAttributes?.sector;
      } else if (dimension === 'application') {
        productValue = product.managedAttributes?.application;
      } else if (dimension === 'productType') {
        productValue = product.managedAttributes?.productType;
      } else if (dimension === 'color') {
        // Para derivados: buscar si el valor está en el array
        const colors = product.derivedAttributes?.colors || [];
        return selectedValues.some(v => colors.includes(v));
      } else if (dimension === 'capacity') {
        // Para derivados: buscar si el valor está en el array
        const capacities = product.derivedAttributes?.capacities || [];
        return selectedValues.some(v => capacities.includes(v));
      } else if (dimension === 'size') {
        // Para derivados: buscar si el valor está en el array
        const sizes = product.derivedAttributes?.sizes || [];
        return selectedValues.some(v => sizes.includes(v));
      }

      // Para atributos gestionados: verificar OR (cualquiera de los valores seleccionados)
      if (!selectedValues.includes(productValue)) {
        // Si el producto no tiene este valor, no pasa el filtro
        return false;
      }
    }

    // Pasó todos los filtros (AND)
    return true;
  });
}

/**
 * Extrae valores únicos de una dimensión en los productos filtrados
 * Útil para actualizar opciones de filtro dinámicamente
 * 
 * @param {Array} products - Array de ProductMaster
 * @param {String} dimension - Dimensión: 'material', 'sector', 'application', 'productType', 'color', 'capacity', 'size'
 * @returns {Array} Valores únicos encontrados
 */
export function getUniqueValuesForDimension(products = [], dimension) {
  const values = new Set();

  products.forEach(product => {
    if (dimension === 'material') {
      const val = product.managedAttributes?.material;
      if (val) values.add(val);
    } else if (dimension === 'sector') {
      const val = product.managedAttributes?.sector;
      if (val) values.add(val);
    } else if (dimension === 'application') {
      const val = product.managedAttributes?.application;
      if (val) values.add(val);
    } else if (dimension === 'productType') {
      const val = product.managedAttributes?.productType;
      if (val) values.add(val);
    } else if (['color', 'capacity', 'size'].includes(dimension)) {
      const derivedKey = dimension === 'color' ? 'colors' 
                        : dimension === 'capacity' ? 'capacities' 
                        : 'sizes';
      const derivedVals = product.derivedAttributes?.[derivedKey] || [];
      derivedVals.forEach(v => values.add(v));
    }
  });

  return Array.from(values).sort();
}
