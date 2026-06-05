/**
 * rules.js - Validaciones y reglas de negocio
 * 
 * Las reglas se aplican independientemente de la UI.
 * Si la UI intenta violarlas, los services las rechazan.
 */

/**
 * Valida si un ProductMaster cumple requisitos mínimos para publicación
 * @param {Object} productMaster - El producto
 * @param {Array} allSkus - Todos los SKUs disponibles (para validar refs)
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export function validatePublishable(productMaster, allSkus = []) {
  const errors = [];

  // Regla 1: Debe tener nombre
  if (!productMaster.name || !productMaster.name.trim()) {
    errors.push('El producto debe tener un nombre.');
  }

  // Regla 2: Debe tener al menos 1 SKU
  const skuIds = productMaster.skuIds || [];
  if (skuIds.length === 0) {
    errors.push('El producto debe tener al menos 1 SKU asociado.');
  }

  // Regla 3: Los SKUs referenciados deben existir
  const skuIdsSet = new Set(allSkus.map(s => s.id));
  skuIds.forEach(id => {
    if (!skuIdsSet.has(id)) {
      errors.push(`SKU con ID ${id} no existe.`);
    }
  });

  // Regla 4: Debe tener imagen principal
  if (!productMaster.media?.mainImageUrl || !productMaster.media.mainImageUrl.trim()) {
    errors.push('El producto debe tener una imagen principal.');
  }

  // Regla 5: Regla de cardinalidad - un SKU solo pertenece a un ProductMaster
  // (Esta se validaría a nivel de base de datos en un sistema real)
  // Por ahora, solo informamos en desarrollo
  if (process.env.NODE_ENV === 'development') {
    // Podrían implementarse checks cruzados aquí
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida campos básicos requeridos para un ProductMaster
 * @param {Object} productMaster - El producto
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export function validateBasic(productMaster) {
  const errors = [];

  if (!productMaster.name || !productMaster.name.trim()) {
    errors.push('Nombre es requerido.');
  }

  if (!productMaster.managedAttributes) {
    errors.push('Atributos gestionados no están configurados.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Verifica si un ProductMaster está en estado válido para editar SKUs
 * @param {Object} productMaster - El producto
 * @returns {boolean}
 */
export function canEditSkus(productMaster) {
  // En draft o published se pueden editar SKUs
  return productMaster.status === 'draft' || productMaster.status === 'published';
}

/**
 * Valida que todos los atributos gestionados requeridos estén presentes
 * @param {Object} managedAttributes - Objeto con atributos
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export function validateManagedAttributes(managedAttributes = {}) {
  const errors = [];
  const required = ['material', 'sector', 'application', 'productType'];

  required.forEach(attr => {
    if (!managedAttributes[attr] || !managedAttributes[attr].trim()) {
      errors.push(`${attr} es requerido.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
