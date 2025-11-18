const API_BASE_URL = 'api/productos.php';

let PRODUCTOS_DB = {
  notebooks: {},
  monitors: {}
};

let productsLoaded = false;
let loadingPromise = null;

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
      throw error;
    });

  return loadingPromise;
}

function onProductsReady(callback) {
  if (productsLoaded) {
    callback(PRODUCTOS_DB);
  } else {
    window.addEventListener('products:loaded', (evt) => {
      callback(evt.detail);
    }, { once: true });
  }
}

async function getProductById(id) {
  if (productsLoaded) {
    const producto = PRODUCTOS_DB.notebooks[id] || PRODUCTOS_DB.monitors[id];
    if (producto) {
      return producto;
    }
  }

  try {
    await loadProductsFromDB();
    return PRODUCTOS_DB.notebooks[id] || PRODUCTOS_DB.monitors[id] || null;
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return null;
  }
}

async function getProductsByType(type) {
  await loadProductsFromDB();

  if (type === 'notebook') {
    return Object.values(PRODUCTOS_DB.notebooks);
  } else if (type === 'monitor') {
    return Object.values(PRODUCTOS_DB.monitors);
  }

  return [];
}

function getAllProducts() {
  return {
    ...PRODUCTOS_DB.notebooks,
    ...PRODUCTOS_DB.monitors
  };
}

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
window.getProductById = getProductById;
window.getProductsByType = getProductsByType;
window.getAllProducts = getAllProducts;
window.searchProducts = searchProducts;
window.getProductsByCategory = getProductsByCategory;
window.onProductsReady = onProductsReady;
