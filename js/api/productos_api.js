// =====================================================
// DIGITAL POINT - API CLIENT PARA PRODUCTOS
// Reemplaza productos_data.js con datos de MySQL
// =====================================================

const API_BASE_URL = 'api/productos.php';

// Cache global de productos
let PRODUCTOS_DB = {
  notebooks: {},
  monitors: {}
};

let productsLoaded = false;
let loadingPromise = null;

// =====================================================
// CARGAR TODOS LOS PRODUCTOS DESDE LA BD
// =====================================================

async function loadProductsFromDB() {
  // Si ya están cargados, retornar cache
  if (productsLoaded) {
    return PRODUCTOS_DB;
  }

  // Si ya hay una petición en curso, esperar esa
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
        // Organizar productos por tipo
        PRODUCTOS_DB.notebooks = {};
        PRODUCTOS_DB.monitors = {};

        data.data.forEach(producto => {
          if (producto.type === 'notebook') {
            PRODUCTOS_DB.notebooks[producto.id] = producto;
          } else if (producto.type === 'monitor') {
            PRODUCTOS_DB.monitors[producto.id] = producto;
          }
        });

        productsLoaded = true;

        console.log('✅ Productos cargados desde BD:', {
          notebooks: Object.keys(PRODUCTOS_DB.notebooks).length,
          monitors: Object.keys(PRODUCTOS_DB.monitors).length,
          total: data.data.length
        });

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('products:loaded', {
          detail: PRODUCTOS_DB
        }));

        return PRODUCTOS_DB;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    })
    .catch(error => {
      console.error('❌ Error al cargar productos:', error);
      loadingPromise = null;
      throw error;
    });

  return loadingPromise;
}

// =====================================================
// HELPER: EJECUTAR AL TENER PRODUCTOS LISTOS
// =====================================================

function onProductsReady(callback) {
  if (productsLoaded) {
    callback(PRODUCTOS_DB);
  } else {
    window.addEventListener('products:loaded', (evt) => {
      callback(evt.detail);
    }, { once: true });
  }
}

// =====================================================
// OBTENER PRODUCTO POR ID (ASÍNCRONO)
// =====================================================

async function getProductById(id) {
  // Intentar desde cache primero
  if (productsLoaded) {
    const producto = PRODUCTOS_DB.notebooks[id] || PRODUCTOS_DB.monitors[id];
    if (producto) {
      return producto;
    }
  }

  // Si no está en cache, cargar todos los productos
  try {
    await loadProductsFromDB();
    return PRODUCTOS_DB.notebooks[id] || PRODUCTOS_DB.monitors[id] || null;
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return null;
  }
}

// =====================================================
// OBTENER PRODUCTOS POR TIPO
// =====================================================

async function getProductsByType(type) {
  await loadProductsFromDB();

  if (type === 'notebook') {
    return Object.values(PRODUCTOS_DB.notebooks);
  } else if (type === 'monitor') {
    return Object.values(PRODUCTOS_DB.monitors);
  }

  return [];
}

// =====================================================
// OBTENER TODOS LOS PRODUCTOS
// =====================================================

function getAllProducts() {
  return {
    ...PRODUCTOS_DB.notebooks,
    ...PRODUCTOS_DB.monitors
  };
}

// =====================================================
// BUSCAR PRODUCTOS
// =====================================================

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

// =====================================================
// FILTRAR POR CATEGORÍA
// =====================================================

function getProductsByCategory(category) {
  const all = getAllProducts();
  return Object.values(all).filter(p =>
    (p.category || '').toLowerCase() === String(category).toLowerCase()
  );
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================

// Cargar productos automáticamente al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromDB().catch(error => {
      console.error('Error en carga inicial de productos:', error);
    });
  });
} else {
  // Si el DOM ya está listo, cargar inmediatamente
  loadProductsFromDB().catch(error => {
    console.error('Error en carga inicial de productos:', error);
  });
}

// =====================================================
// EXPONER FUNCIONES GLOBALMENTE
// =====================================================

window.PRODUCTOS_DB = PRODUCTOS_DB;
window.loadProductsFromDB = loadProductsFromDB;
window.getProductById = getProductById;
window.getProductsByType = getProductsByType;
window.getAllProducts = getAllProducts;
window.searchProducts = searchProducts;
window.getProductsByCategory = getProductsByCategory;
window.onProductsReady = onProductsReady;
