const API_BASE_URL = 'api/productos';

let PRODUCTOS_DB = {
  notebooks: {},
  monitors: {}
};

let productsLoaded = false;
let loadingPromise = null;

/**
 * Carga los productos desde la base de datos
 * @returns {Promise<Object>} Promesa que resuelve con PRODUCTOS_DB
 */
async function loadProductsFromDB() {
  if (productsLoaded) {
    return PRODUCTOS_DB;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = fetch(`${API_BASE_URL}?action=getAll`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success && Array.isArray(data.data)) {
        PRODUCTOS_DB.notebooks = {};
        PRODUCTOS_DB.monitors = {};

        data.data.forEach(producto => {
          if (producto.images && Array.isArray(producto.images)) {
            producto.images = producto.images.map(img => {
              if (!img) return '';
              if (img.startsWith('http') || img.startsWith('/digitalpoint/')) {
                return img;
              }
              if (img.startsWith('/')) {
                return '/digitalpoint' + img;
              }
              return '/digitalpoint/' + img;
            });
          }

          if (producto.type === 'notebook') {
            PRODUCTOS_DB.notebooks[producto.id] = producto;
          } else if (producto.type === 'monitor') {
            PRODUCTOS_DB.monitors[producto.id] = producto;
          }
        });

        productsLoaded = true;

        console.log('Productos cargados desde BD:', {
          notebooks: Object.keys(PRODUCTOS_DB.notebooks).length,
          monitors: Object.keys(PRODUCTOS_DB.monitors).length,
          total: data.data.length
        });

        window.dispatchEvent(new CustomEvent('products:loaded', {
          detail: PRODUCTOS_DB
        }));

        return PRODUCTOS_DB;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    })
    .catch(error => {
      console.error('Error al cargar productos:', error);
      loadingPromise = null;
      productsLoaded = false;
      throw error;
    });

  return loadingPromise;
}

/**
 * Asegura que los productos estén cargados antes de continuar
 * @returns {Promise<Object>} Promesa que resuelve con PRODUCTOS_DB
 */
async function ensureProductsLoaded() {
  if (productsLoaded) {
    return PRODUCTOS_DB;
  }
  await loadProductsFromDB();
  return PRODUCTOS_DB;
}

/**
 * Ejecuta callback cuando los productos estén listos
 * @param {Function} callback - Función a ejecutar
 */
function onProductsReady(callback) {
  if (productsLoaded) {
    callback(PRODUCTOS_DB);
  } else {
    window.addEventListener('products:loaded', (evt) => {
      callback(evt.detail);
    }, { once: true });
  }
}

/**
 * Obtiene un producto por ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object|null>} Producto o null
 */
async function getProductById(id) {
  await ensureProductsLoaded();
  return PRODUCTOS_DB.notebooks[id] || PRODUCTOS_DB.monitors[id] || null;
}

/**
 * Obtiene productos por tipo
 * @param {string} type - 'notebook' o 'monitor'
 * @returns {Promise<Array>} Array de productos
 */
async function getProductsByType(type) {
  await ensureProductsLoaded();

  if (type === 'notebook') {
    return Object.values(PRODUCTOS_DB.notebooks);
  } else if (type === 'monitor') {
    return Object.values(PRODUCTOS_DB.monitors);
  }

  return [];
}

/**
 * Obtiene todos los productos (síncrono)
 * @returns {Object} Objeto con todos los productos
 */
function getAllProducts() {
  return {
    ...PRODUCTOS_DB.notebooks,
    ...PRODUCTOS_DB.monitors
  };
}

/**
 * Busca productos por query
 * @param {string} query - Texto de búsqueda
 * @returns {Array} Array de productos que coinciden
 */
function searchProducts(query) {
  const all = getAllProducts();
  const q = String(query).toLowerCase();

  return Object.values(all).filter(p =>
    (p.title || '').toLowerCase().includes(q) ||
    (p.brand || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q)
  );
}

/**
 * Obtiene productos por categoría
 * @param {string} category - Nombre de categoría
 * @returns {Array} Array de productos de esa categoría
 */
function getProductsByCategory(category) {
  const all = getAllProducts();
  return Object.values(all).filter(p =>
    (p.category || '').toLowerCase() === String(category).toLowerCase()
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromDB().catch(error => {
      console.error('Error en carga inicial de productos:', error);
    });
  });
} else {
  loadProductsFromDB().catch(error => {
    console.error('Error en carga inicial de productos:', error);
  });
}

window.PRODUCTOS_DB = PRODUCTOS_DB;
window.loadProductsFromDB = loadProductsFromDB;
window.ensureProductsLoaded = ensureProductsLoaded;
window.getProductById = getProductById;
window.getProductsByType = getProductsByType;
window.getAllProducts = getAllProducts;
window.searchProducts = searchProducts;
window.getProductsByCategory = getProductsByCategory;
window.onProductsReady = onProductsReady;

window.waitForProducts = async function(callback) {
  await ensureProductsLoaded();
  callback(PRODUCTOS_DB);
};