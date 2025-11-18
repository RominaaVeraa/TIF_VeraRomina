(function () {
  const ADMIN_EMAIL = 'admin@digitalpoint.com';
  const ADMIN_MODE_KEY = 'digitalpoint_admin_mode_active';

  function isClientAdmin() {
    try {
      const body = document.body;
      const roleAttr = body && body.dataset ? body.dataset.userRole : '';
      const role = (roleAttr || '').toLowerCase();

      if (role === 'admin') {
        console.log('[Admin] Rol detectado desde PHP:', roleAttr, '→ es admin');
        return true;
      }

      const email = sessionStorage.getItem('currentUserEmail');
      console.log('[Admin] Rol no es admin, verificando email en sessionStorage:', email);
      return email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    } catch (e) {
      console.error('[Admin] Error verificando admin:', e);
      return false;
    }
  }


  function checkAndApplyAdminMode() {
    if (!isClientAdmin()) {
      console.log('[Admin] No es admin, saltando checkAndApplyAdminMode');
      return;
    }

    const adminModeActive = sessionStorage.getItem(ADMIN_MODE_KEY) === 'true';
    
    if (adminModeActive) {
      adminMode = true;
      document.body.classList.add('admin-mode');
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
              checkAndApplyAdminMode();
              setupMutationObserver();
            }, 500);
          });
          window.addEventListener('user:loaded', () => {
            console.log('[Admin] Usuario cargado, inicializando UI...');
            setTimeout(() => {
              initProfileAdminUI();
            }, 100);
          });
      } else {
        setTimeout(() => {
          attachAdminControls();
          showAdminModeIndicator();
        }, 500);
      }
    }
  }

  function initProfileAdminUI() {
    console.log('[DEBUG 1] initProfileAdminUI ejecutada');
    console.log('[DEBUG 2] isClientAdmin():', isClientAdmin());
    console.log('[DEBUG 3] sessionStorage email:', sessionStorage.getItem('currentUserEmail'));
    
    setTimeout(() => {
      const adminTabButton = document.querySelector('.tab-btn.admin-only[data-tab="admin"]');
      const adminTabContent = document.getElementById('adminTab');
      const adminBadge = document.getElementById('adminBadge');

      console.log('[DEBUG 4] adminTabButton:', adminTabButton);
      console.log('[DEBUG 5] adminTabContent:', adminTabContent);
      console.log('[DEBUG 6] adminBadge:', adminBadge);

      if (!adminTabButton && !adminTabContent && !adminBadge) {
        console.log('[DEBUG 7] No hay elementos admin en esta página');
        return;
      }

      if (isClientAdmin()) {
        console.log('[DEBUG 8] ✓ Es admin, mostrando panel');
        
        if (adminTabButton) {
          adminTabButton.style.cssText = 'display: inline-flex !important; visibility: visible !important;';
          console.log('[DEBUG 9] Tab button mostrado');
        }

        if (adminTabContent) {
          adminTabContent.classList.remove('admin-only');
          adminTabContent.style.removeProperty('display'); 
          console.log('[DEBUG 10] Tab content preparado (se muestra solo cuando esté activo)');
        }

        
        if (adminBadge) {
          adminBadge.style.display = 'inline-block';
          console.log('[DEBUG 11] Badge mostrado');
        }

        const ordersTabBtn = document.querySelector('.tab-btn[data-tab="orders"]');
        const ordersTabContent = document.getElementById('ordersTab');
        console.log('[DEBUG 12] ordersTabBtn:', ordersTabBtn);
        console.log('[DEBUG 13] ordersTabContent:', ordersTabContent);
        
        if (ordersTabBtn) ordersTabBtn.remove();
        if (ordersTabContent) ordersTabContent.remove();
        

        loadAdminStats();
      } else {
        console.log('[DEBUG 14] No es admin, ocultando panel');
        if (adminTabButton) adminTabButton.style.display = 'none';
        if (adminTabContent) adminTabContent.style.display = 'none';
        if (adminBadge) adminBadge.style.display = 'none';
      }
    }, 300);
  }
  function loadAdminStats() {
    fetch('admin_actions.php?action=get_stats')
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.stats) return;

        const { productos, usuarios, ofertas, pedidos, pedidos_pendientes } = data.stats;

        const elProd = document.getElementById('statProductos');
        const elUser = document.getElementById('statUsuarios');
        const elOfer = document.getElementById('statOfertas');
        const elPedidos = document.getElementById('statPedidos');
        const elPendientes = document.getElementById('statPendientes');

        if (elProd) elProd.textContent = productos;
        if (elUser) elUser.textContent = usuarios;
        if (elOfer) elOfer.textContent = ofertas;
        if (elPedidos) elPedidos.textContent = pedidos;
        if (elPendientes) elPendientes.textContent = pedidos_pendientes;
      })
      .catch(err => console.error('Error cargando stats admin:', err));
  }

  let adminMode = false;

  function removeActivationToastFromDom() {
    const kill = () => {
      const toasts = document.querySelectorAll('.toast');
      toasts.forEach(t => {
        const txt = (t.textContent || '').trim();
        if (txt.includes('Modo edición ACTIVADO en todo el sitio')) {
          console.log('[Admin] Toast de activación eliminado del DOM');
          t.remove();
        }
      });
    };
    setTimeout(kill, 10);
    setTimeout(kill, 300);
    setTimeout(kill, 800);
  }

  function toggleAdminMode() {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede activar el modo edición', 'error');
      return;
    }

    adminMode = !adminMode;
    sessionStorage.setItem(ADMIN_MODE_KEY, adminMode ? 'true' : 'false');
    document.body.classList.toggle('admin-mode', adminMode);

    if (adminMode) {
      attachAdminControls();
      showAdminModeIndicator();
      removeActivationToastFromDom();
    } else {
      removeAdminModeIndicator();
      showToast('Modo edición desactivado', 'info');
    }
  }

  function isOffersPage() {
    return window.location.pathname.includes('ofertas.php') || 
           window.location.pathname.includes('ofertas') ||
           document.querySelector('.offers-hero') !== null;
  }

  function attachAdminControls() {
    const isProductDetailPage = document.querySelector('.product-main');
    
    if (isProductDetailPage) {
      attachProductDetailControls();
      return;
    }

    document.querySelectorAll('.admin-edit-controls').forEach(el => el.remove());

    const tableRows = document.querySelectorAll('.products-table tbody tr[data-product-id]');
    
    if (tableRows.length > 0) {
      console.log(`[Admin] Detectada TABLA con ${tableRows.length} productos`);
      
      tableRows.forEach(row => {
        const productId = row.getAttribute('data-product-id');
        if (!productId) return;

        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        if (actionsCell.querySelector('.admin-edit-controls')) return;

        const controls = document.createElement('div');
        controls.className = 'admin-edit-controls';
        controls.setAttribute('data-admin-controls', 'true');

        const btnEdit = document.createElement('button');
        btnEdit.className = 'admin-edit-btn';
        btnEdit.textContent = 'EDITAR';
        btnEdit.setAttribute('aria-label', 'Editar producto');
        btnEdit.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openEditModal(productId);
        });

        const btnDelete = document.createElement('button');
        btnDelete.className = 'admin-delete-btn';
        btnDelete.textContent = 'ELIMINAR';
        btnDelete.setAttribute('aria-label', 'Eliminar producto');
        btnDelete.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          confirmDeleteProduct(productId);
        });

        controls.appendChild(btnEdit);
        controls.appendChild(btnDelete);
        
        actionsCell.appendChild(controls);
      });

      console.log('[Admin] Controles agregados a TABLA');
      return;
    }

    const mainSelectors = [
      '.product-card:not(.product-card .product-card)',
      '.offer-card:not(.offer-card .offer-card)',
      '.notebook-card:not(.notebook-card .notebook-card)',
      '.monitor-card:not(.monitor-card .monitor-card)',
      '.cart-item'
    ];

    let allCards = [];
    
    mainSelectors.forEach(selector => {
      const cards = document.querySelectorAll(selector);
      cards.forEach(card => {
        const isNested = card.parentElement.closest('.product-card, .offer-card, .notebook-card, .monitor-card');
        
        if (!isNested && !allCards.includes(card)) {
          allCards.push(card);
        }
      });
    });

    console.log(`[Admin] Encontradas ${allCards.length} tarjetas únicas`);

    allCards.forEach(card => {
      if (card.querySelector('.admin-edit-controls')) {
        console.log('[Admin] Tarjeta ya tiene controles, omitiendo');
        return;
      }

      const productId = card.getAttribute('data-product-id') 
                     || card.getAttribute('data-id')
                     || card.id;

      if (!productId) {
        console.warn('[Admin] Tarjeta sin ID:', card);
        return;
      }

      const controls = document.createElement('div');
      controls.className = 'admin-edit-controls';
      controls.setAttribute('data-admin-controls', 'true');

      const inOffersPage = isOffersPage();

      const btnEdit = document.createElement('button');
      btnEdit.className = 'admin-edit-btn';
      btnEdit.textContent = inOffersPage ? 'MODIFICAR OFERTA' : 'EDITAR';
      btnEdit.setAttribute('aria-label', inOffersPage ? 'Modificar oferta' : 'Editar producto');
      btnEdit.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inOffersPage) {
          openModifyOfferModal(productId);
        } else {
          openEditModal(productId);
        }
      });

      const btnDelete = document.createElement('button');
      btnDelete.className = 'admin-delete-btn';
      btnDelete.textContent = inOffersPage ? 'ELIMINAR OFERTA' : 'ELIMINAR';
      btnDelete.setAttribute('aria-label', inOffersPage ? 'Eliminar oferta' : 'Eliminar producto');
      btnDelete.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inOffersPage) {
          confirmDeleteOffer(productId);
        } else {
          confirmDeleteProduct(productId);
        }
      });

      controls.appendChild(btnEdit);
      controls.appendChild(btnDelete);
      
      const position = window.getComputedStyle(card).position;
      if (position === 'static') {
        card.style.position = 'relative';
      }
      
      card.appendChild(controls);
    });

    console.log('[Admin] Controles agregados sin duplicados');
  }

  function attachProductDetailControls() {
    document.querySelectorAll('.product-main .admin-edit-controls').forEach(el => el.remove());

    const productContainer = document.querySelector('.product-container');
    if (!productContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
      console.warn('[Admin] No se encontró ID en URL');
      return;
    }

    const controls = document.createElement('div');
    controls.className = 'admin-edit-controls';

    const btnEdit = document.createElement('button');
    btnEdit.className = 'admin-edit-btn';
    btnEdit.textContent = 'EDITAR PRODUCTO';
    btnEdit.setAttribute('aria-label', 'Editar producto');
    btnEdit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditModal(productId);
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'admin-delete-btn';
    btnDelete.textContent = 'ELIMINAR';
    btnDelete.setAttribute('aria-label', 'Eliminar producto');
    btnDelete.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      confirmDeleteProduct(productId);
    });

    controls.appendChild(btnEdit);
    controls.appendChild(btnDelete);
    document.body.appendChild(controls);
    
    console.log('[Admin] Controles en ficha agregados');
  }

  window.addEventListener('products:loaded', () => {
    console.log('[Admin] Evento products:loaded');
    if (adminMode) {
      setTimeout(() => {
        attachAdminControls();
      }, 300);
    }
  });

  function setupMutationObserver() {
    if (!isClientAdmin()) return;

    const observer = new MutationObserver((mutations) => {
      if (!adminMode) return;

      let shouldReattach = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.matches && (
              node.matches('[data-product-id]') ||
              node.matches('.product-card') ||
              node.matches('.offer-card') ||
              node.querySelector('[data-product-id]') ||
              node.querySelector('.product-card') ||
              node.querySelector('.offer-card')
            )) {
              shouldReattach = true;
            }
          }
        });
      });

      if (shouldReattach) {
        console.log('[Admin] Nuevos productos detectados');
        setTimeout(() => {
          attachAdminControls();
        }, 200);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[Admin] MutationObserver activado');
  }

  function showAdminModeIndicator() {
    let indicator = document.querySelector('.admin-mode-indicator');
    if (indicator) {
      indicator.style.display = 'flex';
      return;
    }
    indicator = document.createElement('div');
    indicator.className = 'admin-mode-indicator';
    indicator.innerHTML = `
      <span>MODO EDICIÓN ACTIVO EN TODO EL SITIO</span>
      <button type="button" id="adminModeOffBtn">Desactivar</button>
    `;
    document.body.appendChild(indicator);

    indicator.querySelector('#adminModeOffBtn').addEventListener('click', () => {
      toggleAdminMode();
    });
  }

  function removeAdminModeIndicator() {
    const indicator = document.querySelector('.admin-mode-indicator');
    if (indicator) indicator.remove();
  }

  let currentEditingProductId = null;
  let isCreatingNewProduct = false;

  function ensureEditModal() {
    let modal = document.querySelector('.admin-edit-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'admin-edit-modal';
    modal.innerHTML = `
      <div class="admin-edit-modal-content">
        <h2 id="adminEditModalTitle">Editar producto</h2>
        <form id="adminEditProductForm">
          <div class="form-group">
            <label for="adminEditId">ID del producto *</label>
            <input type="text" id="adminEditId" name="id" required placeholder="ej: notebook11">
          </div>
          <div class="form-group">
            <label for="adminEditTitle">Título *</label>
            <input type="text" id="adminEditTitle" name="title" required placeholder="Nombre del producto">
          </div>
          <div class="form-group">
            <label for="adminEditBrand">Marca</label>
            <input type="text" id="adminEditBrand" name="brand" placeholder="MSI, ASUS, etc">
          </div>
          <div class="form-group">
            <label for="adminEditModel">Modelo</label>
            <input type="text" id="adminEditModel" name="model" placeholder="Modelo específico">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="adminEditPrice">Precio *</label>
              <input type="number" id="adminEditPrice" name="price" min="0" step="1" required>
            </div>
            <div class="form-group">
              <label for="adminEditStock">Stock *</label>
              <input type="number" id="adminEditStock" name="stock" min="0" step="1" required>
            </div>
          </div>
          <div class="form-group">
            <label for="adminEditCategory">Categoría</label>
            <input type="text" id="adminEditCategory" name="category" placeholder="Gaming, Profesional, etc">
          </div>
          <div class="form-group">
            <label for="adminEditType">Tipo *</label>
            <select id="adminEditType" name="type" required>
              <option value="notebook">Notebook</option>
              <option value="monitor">Monitor</option>
            </select>
          </div>
          <div class="form-group">
            <label for="adminEditImage">URL de imagen</label>
            <input type="text" id="adminEditImage" name="image" placeholder="images/Notebook/notebook11.png">
          </div>
          <div class="form-group">
            <label for="adminEditDescription">Descripción</label>
            <textarea id="adminEditDescription" name="description" rows="4" placeholder="Descripción detallada..."></textarea>
          </div>

          <div class="admin-edit-modal-actions">
            <button type="submit" class="admin-save-btn">Guardar cambios</button>
            <button type="button" class="admin-cancel-btn" id="adminCancelEditBtn">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeEditModal();
    });

    modal.querySelector('#adminCancelEditBtn').addEventListener('click', (e) => {
      e.preventDefault();
      closeEditModal();
    });

    modal.querySelector('#adminEditProductForm').addEventListener('submit', onSaveEditProduct);

    return modal;
  }

  async function openEditModal(productId) {
    isCreatingNewProduct = false;
    currentEditingProductId = productId;

    const modal = ensureEditModal();
    const titleEl = document.getElementById('adminEditModalTitle');
    if (titleEl) titleEl.textContent = 'Editar producto';

    modal.classList.add('active');

    let product = null;
    
    if (typeof getProductById === 'function') {
      try {
        product = await getProductById(productId);
      } catch (e) {
        console.error('Error en getProductById:', e);
      }
    }
    
    if (!product && window.PRODUCTOS_DB) {
      if (window.PRODUCTOS_DB.notebooks && window.PRODUCTOS_DB.notebooks[productId]) {
        product = window.PRODUCTOS_DB.notebooks[productId];
      } else if (window.PRODUCTOS_DB.monitors && window.PRODUCTOS_DB.monitors[productId]) {
        product = window.PRODUCTOS_DB.monitors[productId];
      }
    }

    if (!product) {
      const card = document.querySelector(`[data-product-id="${productId}"]`);
      if (card) {
        product = {
          id: productId,
          title: card.querySelector('.product-title, h3, .title')?.textContent || '',
          brand: card.querySelector('.brand, .marca')?.textContent || '',
          price: card.querySelector('.price, .precio')?.textContent?.replace(/[^0-9]/g, '') || 0,
          type: 'notebook'
        };
      }
    }

    if (!product) {
      showToast('No se encontró el producto', 'warning');
      product = { id: productId, type: 'notebook' };
    }

    const form = document.getElementById('adminEditProductForm');
    form.id.value = product.id || productId;
    form.id.disabled = true;
    form.title.value = product.title || product.titulo || '';
    form.brand.value = product.brand || product.marca || '';
    form.model.value = product.model || product.modelo || '';
    form.price.value = product.price || product.precio || 0;
    form.stock.value = product.stock || 0;
    form.category.value = product.category || product.categoria || '';
    form.type.value = product.type || product.tipo || 'notebook';
    form.image.value = product.image || product.imageUrl || product.imagen || '';
    form.description.value = product.description || product.descripcion || '';
  }

  function openAddProductModal() {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede agregar productos', 'error');
      return;
    }

    isCreatingNewProduct = true;
    currentEditingProductId = null;

    const modal = ensureEditModal();
    const titleEl = document.getElementById('adminEditModalTitle');
    if (titleEl) titleEl.textContent = 'Agregar nuevo producto';

    modal.classList.add('active');

    const form = document.getElementById('adminEditProductForm');
    form.reset();
    form.id.disabled = false;
    form.brand.value = 'MSI';
    form.type.value = 'notebook';
  }

  function closeEditModal() {
    const modal = document.querySelector('.admin-edit-modal');
    if (modal) modal.classList.remove('active');
    currentEditingProductId = null;
    isCreatingNewProduct = false;

    const inputId = document.getElementById('adminEditId');
    if (inputId) inputId.disabled = false;
  }

  function onSaveEditProduct(e) {
    e.preventDefault();

    const form = e.target;
    const idValue = form.id.value.trim();

    if (isCreatingNewProduct && !idValue) {
      showToast('El ID del producto es obligatorio', 'error');
      return;
    }

    const formData = new URLSearchParams();

    if (isCreatingNewProduct) {
      formData.append('action', 'add_product');
      formData.append('id', idValue);
    } else {
      if (!currentEditingProductId) {
        showToast('No hay producto seleccionado', 'error');
        return;
      }
      formData.append('action', 'update_product');
      formData.append('id', currentEditingProductId);
    }

    formData.append('title', form.title.value.trim());
    formData.append('brand', form.brand.value.trim());
    formData.append('model', form.model.value.trim());
    formData.append('price', form.price.value || 0);
    formData.append('stock', form.stock.value || 0);
    formData.append('category', form.category.value.trim());
    formData.append('type', form.type.value);
    formData.append('description', form.description.value.trim());

    if (isCreatingNewProduct) {
      const imageUrl = form.image.value.trim();
      if (imageUrl) formData.append('image', imageUrl);
    }

    fetch('admin_actions.php', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast(
            isCreatingNewProduct ? 'Producto agregado correctamente' : 'Producto actualizado',
            'success'
          );
          closeEditModal();
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(data.message || 'Error al guardar producto', 'error');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al guardar producto', 'error');
      });
  }

  function confirmDeleteProduct(productId) {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede eliminar productos', 'error');
      return;
    }

    const ok = confirm('¿Seguro que querés eliminar este producto?\n\nNo se puede deshacer.');
    if (!ok) return;

    const body = new URLSearchParams();
    body.append('action', 'delete_product');
    body.append('id', productId);

    fetch('admin_actions.php', {
      method: 'POST',
      body
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast('Producto eliminado', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(data.message || 'Error al eliminar', 'error');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al eliminar producto', 'error');
      });
  }

  let currentEditingOfferId = null;
  let isCreatingNewOffer = false;

  function ensureOfferModal() {
    let modal = document.querySelector('.admin-offer-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'admin-edit-modal admin-offer-modal';
    modal.innerHTML = `
      <div class="admin-edit-modal-content">
        <h2 id="adminOfferModalTitle">Modificar oferta</h2>
        <form id="adminOfferForm">
          <div class="form-group">
            <label for="adminOfferProductId">ID del producto *</label>
            <input type="text" id="adminOfferProductId" name="producto_id" required placeholder="notebook11, monitor5, etc" readonly>
            <small style="color: rgba(255,255,255,0.6); font-size: 12px;">El producto debe existir en la base de datos</small>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="adminOfferDiscount">Descuento % *</label>
              <input type="number" id="adminOfferDiscount" name="descuento" min="1" max="99" step="1" required placeholder="10, 20, 30...">
            </div>
            <div class="form-group">
              <label for="adminOfferActive">Estado</label>
              <select id="adminOfferActive" name="activo">
                <option value="1">Activa</option>
                <option value="0">Inactiva</option>
              </select>
            </div>
          </div>

          <div class="admin-edit-modal-actions">
            <button type="submit" class="admin-save-btn">Guardar cambios</button>
            <button type="button" class="admin-cancel-btn" id="adminCancelOfferBtn">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeOfferModal();
    });

    const cancelBtn = modal.querySelector('#adminCancelOfferBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeOfferModal();
      });
    }

    const form = modal.querySelector('#adminOfferForm');
    if (form) {
      form.addEventListener('submit', onSaveModifyOffer);
    }

    return modal;
  }

  function openModifyOfferModal(productId) {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede modificar ofertas', 'error');
      return;
    }

    console.log('[Admin] Abriendo modal para modificar oferta del producto:', productId);

    const modal = ensureOfferModal();
    const titleEl = document.getElementById('adminOfferModalTitle');
    if (titleEl) titleEl.textContent = 'Modificar oferta';

    modal.classList.add('active');

    const form = document.getElementById('adminOfferForm');
    if (!form) {
      console.error('[Admin] No se encontró el formulario');
      return;
    }

    form.producto_id.value = productId;
    form.producto_id.readOnly = true;

    form.descuento.value = 10;
    form.activo.value = 1;
    currentEditingOfferId = null;
    isCreatingNewOffer = false;

    console.log('[Admin] Cargando datos de la oferta...');
    fetch(`admin_actions.php?action=get_offers`)
      .then(r => r.json())
      .then(data => {
        console.log('[Admin] Datos recibidos:', data);
        
        if (data.success && Array.isArray(data.offers)) {
          const oferta = data.offers.find(o => o.producto_id === productId);
          
          if (oferta) {
            console.log('[Admin] Oferta encontrada:', oferta);
            form.descuento.value = oferta.descuento;
            form.activo.value = oferta.activo;
            currentEditingOfferId = oferta.id;
            isCreatingNewOffer = false;
            console.log('[Admin] currentEditingOfferId establecido:', currentEditingOfferId);
          } else {
            console.log('[Admin] No existe oferta para este producto, se creará una nueva');
            isCreatingNewOffer = true;
            showToast('No existe oferta para este producto. Se creará una nueva.', 'info');
          }
        }
      })
      .catch(err => {
        console.error('[Admin] Error al cargar oferta:', err);
        showToast('Error al cargar datos de la oferta', 'error');
      });

    let productData = null;
    if (window.offersData) {
        productData = window.offersData.find(o => o.id === productId);
        if (productData) {
            console.log('[Admin] Datos del producto encontrados en offersData:', productData);
        }
    }
  }

  function openAddOfferModal() {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede agregar ofertas', 'error');
      return;
    }

    isCreatingNewOffer = true;
    currentEditingOfferId = null;

    const modal = ensureOfferModal();
    const titleEl = document.getElementById('adminOfferModalTitle');
    if (titleEl) titleEl.textContent = 'Agregar nueva oferta';

    modal.classList.add('active');

    const form = document.getElementById('adminOfferForm');
    form.reset();
    form.producto_id.readOnly = false;
  }

  function closeOfferModal() {
    const modal = document.querySelector('.admin-offer-modal');
    if (modal) modal.classList.remove('active');
    currentEditingOfferId = null;
    isCreatingNewOffer = false;
  }

  function onSaveModifyOffer(e) {
    e.preventDefault();

    const form = e.target;
    const productId = form.producto_id.value.trim();
    const descuento = parseInt(form.descuento.value);
    const activo = parseInt(form.activo.value);

    if (!productId || !descuento || descuento < 1 || descuento > 99) {
      alert('Completá todos los campos correctamente (descuento entre 1-99%)');
      return;
    }

    const formData = new URLSearchParams();
    
    if (currentEditingOfferId && !isCreatingNewOffer) {
      formData.append('action', 'update_offer');
      formData.append('id', currentEditingOfferId);
      formData.append('descuento', descuento);
      formData.append('activo', activo);
    } else {
      formData.append('action', 'add_offer');
      formData.append('producto_id', productId);
      formData.append('descuento', descuento);
      formData.append('activo', activo);
    }

    const submitBtn = form.querySelector('.admin-save-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    fetch('admin_actions.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        document.querySelectorAll('.admin-offer-modal').forEach(m => m.remove());
        
        window.location.reload();
      } else {
        alert(data.message || 'Error al guardar oferta');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar cambios';
        }
      }
    })
    .catch(err => {
      console.error('Error:', err);
      alert('Error al guardar oferta');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar cambios';
      }
    });
  }

  
  function confirmDeleteOffer(productId) {
    if (!isClientAdmin()) {
      showToast('Solo el administrador puede eliminar ofertas', 'error');
      return;
    }

    const ok = confirm('¿Seguro que querés eliminar esta OFERTA?\n\nEl producto NO será eliminado, solo la oferta.');
    if (!ok) return;

    fetch(`admin_actions.php?action=get_offers`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.offers)) {
          const oferta = data.offers.find(o => o.producto_id === productId);
          
          if (!oferta) {
            showToast('No se encontró la oferta', 'error');
            return;
          }

          const body = new URLSearchParams();
          body.append('action', 'delete_offer');
          body.append('id', oferta.id);

          return fetch('admin_actions.php', {
            method: 'POST',
            body
          });
        } else {
          throw new Error('No se pudo obtener la lista de ofertas');
        }
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast('Oferta eliminada correctamente', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(data.message || 'Error al eliminar oferta', 'error');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al eliminar oferta', 'error');
      });
  }

  function viewAllUsers() {
    if (!isClientAdmin()) {
      showToast('Solo el admin puede ver usuarios', 'error');
      return;
    }

    fetch('admin_actions.php?action=get_users')
      .then(r => r.json())
      .then(data => {
        if (!data.success || !Array.isArray(data.users)) {
          showToast('No se pudieron cargar los usuarios', 'error');
          return;
        }

        const lines = data.users.map(u => {
          return `${u.id} - ${u.nombre} ${u.apellido} (${u.email}) [${u.rol}]`;
        });

        alert('Usuarios registrados:\n\n' + lines.join('\n'));
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al cargar usuarios', 'error');
      });
  }

  function viewAllOffers() {
    if (!isClientAdmin()) {
      showToast('Solo el admin puede ver ofertas', 'error');
      return;
    }

    fetch('admin_actions.php?action=get_offers')
      .then(r => r.json())
      .then(data => {
        console.log('[Admin] Datos de ofertas:', data);
        
        if (!data.success) {
          showToast(data.message || 'No se pudieron cargar las ofertas', 'error');
          return;
        }

        if (!Array.isArray(data.offers)) {
          showToast('Formato de respuesta inválido', 'error');
          return;
        }

        if (data.offers.length === 0) {
          showToast('No hay ofertas registradas', 'info');
          return;
        }

        showOffersListModal(data.offers);
      })
      .catch(err => {
        console.error('[Admin] Error al cargar ofertas:', err);
        showToast('Error al cargar ofertas: ' + err.message, 'error');
      });
  }

  function showOffersListModal(offers) {
    const existingModal = document.querySelector('.admin-offers-list-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'admin-edit-modal admin-offers-list-modal active';
    
    const offersHTML = offers.map(o => {
      const estado = o.activo == 1 ? 'Activa' : 'Inactiva';
      const estadoClass = o.activo == 1 ? 'status-active' : 'status-inactive';
      const titulo = o.producto_titulo || 'Sin título';
      const precioOriginal = o.precio_original ? parseFloat(o.precio_original) : 0;
      const precioOferta = o.precio_oferta ? parseFloat(o.precio_oferta) : 0;
      
      return `
        <div class="offer-list-item">
          <div class="offer-list-header">
            <h4>${titulo}</h4>
            <span class="offer-list-badge ${estadoClass}">${estado}</span>
          </div>
          <div class="offer-list-details">
            <span><strong>ID Oferta:</strong> ${o.id}</span>
            <span><strong>Producto:</strong> ${o.producto_id}</span>
            <span><strong>Descuento:</strong> ${o.descuento}%</span>
            <span><strong>Precio Original:</strong> ${precioOriginal.toLocaleString('es-AR')}</span>
            <span><strong>Precio Oferta:</strong> <span style="color: #10b981; font-weight: 700;">${precioOferta.toLocaleString('es-AR')}</span></span>
          </div>
          <div class="offer-list-actions">
            <button onclick="toggleOfferFromList(${o.id})" class="mini-btn ${o.activo == 1 ? 'btn-warning' : 'btn-success'}">
              ${o.activo == 1 ? 'Desactivar' : 'Activar'}
            </button>
            <button onclick="editOfferFromList('${o.producto_id}')" class="mini-btn btn-primary">
              Editar
            </button>
            <button onclick="deleteOfferFromList(${o.id})" class="mini-btn btn-danger">
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="admin-edit-modal-content">
        <h2>Ofertas Activas (${offers.length})</h2>
        <div class="offers-list-container">
          ${offersHTML}
        </div>
        <div class="admin-edit-modal-actions">
          <button type="button" class="admin-cancel-btn" onclick="closeOffersListModal()">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeOffersListModal();
    });
  }

  function closeOffersListModal() {
    const modal = document.querySelector('.admin-offers-list-modal');
    if (modal) modal.remove();
  }

  function toggleOfferFromList(offerId) {
    if (!confirm('¿Cambiar el estado de esta oferta?')) return;

    const formData = new URLSearchParams();
    formData.append('action', 'toggle_offer');
    formData.append('id', offerId);

    fetch('admin_actions.php', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast(data.message || 'Estado actualizado', 'success');
          closeOffersListModal();
          viewAllOffers();
        } else {
          showToast(data.message || 'Error al actualizar', 'error');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al actualizar oferta', 'error');
      });
  }

  function editOfferFromList(productId) {
    closeOffersListModal();
    openModifyOfferModal(productId);
  }

  function deleteOfferFromList(offerId) {
    if (!confirm('¿Seguro que querés eliminar esta oferta?\n\nEl producto NO será eliminado.')) return;

    const formData = new URLSearchParams();
    formData.append('action', 'delete_offer');
    formData.append('id', offerId);

    fetch('admin_actions.php', {
      method: 'POST',
      body: formData
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          showToast('Oferta eliminada correctamente', 'success');
          closeOffersListModal();
          viewAllOffers();
        } else {
          showToast(data.message || 'Error al eliminar', 'error');
        }
      })
      .catch(err => {
        console.error('Error:', err);
        showToast('Error al eliminar oferta', 'error');
      });
  }

  function showToast(message, type = 'info') {
    if (typeof message === 'string' && message.includes('Modo edición ACTIVADO en todo el sitio')) {
      console.log('[Admin] Toast de activación suprimido');
      return;
    }

    if (window.showToast) {
      window.showToast(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
      alert(message);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initProfileAdminUI();
      checkAndApplyAdminMode();
      setupMutationObserver();
    }, 500); 
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(() => {
      checkAndApplyAdminMode();
      setupMutationObserver();
    }, 500);
  }

  window.toggleAdminMode = toggleAdminMode;
  window.viewAllUsers = viewAllUsers;
  window.openAddProductModal = openAddProductModal;
  window.openAddOfferModal = openAddOfferModal;
  window.viewAllOffers = viewAllOffers;
  window.closeOffersListModal = closeOffersListModal;
  window.toggleOfferFromList = toggleOfferFromList;
  window.editOfferFromList = editOfferFromList;
  window.deleteOfferFromList = deleteOfferFromList;

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      toggleAdminMode();
    }
  });

  console.log('[Admin Controls] Sistema inicializado');
  console.log('[Admin] Modo:', adminMode ? 'ACTIVO' : 'INACTIVO');
})();


let allOrders = [];
let filteredOrders = [];

async function loadAllOrders() {
  const section = document.getElementById('ordersManagementSection');
  const container = document.getElementById('ordersListContainer');
  
  if (!section || !container) {
    console.error('No se encontraron los contenedores necesarios');
    return;
  }
  
  section.style.display = 'block';
  container.innerHTML = '<div class="loading-orders"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch('admin_actions.php?action=get_all_orders');
    const data = await response.json();
    
    if (data.success && Array.isArray(data.orders)) {
      allOrders = data.orders;
      filteredOrders = [...allOrders];
      renderOrders();
      updateOrdersStats();
    } else {
      container.innerHTML = '<div class="empty-orders-admin"><h3>No se pudieron cargar los pedidos</h3></div>';
    }
  } catch (error) {
    console.error('Error al cargar pedidos:', error);
    container.innerHTML = '<div class="empty-orders-admin"><h3>Error al cargar pedidos</h3></div>';
  }
}

function renderOrders() {
  const container = document.getElementById('ordersListContainer');
  
  if (!container) return;
  
  if (filteredOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders-admin">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h3>No hay pedidos que coincidan con los filtros</h3>
        <p>Intenta ajustar los criterios de búsqueda</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = '<div class="admin-orders-list">' +
    filteredOrders.map(order => createOrderCard(order)).join('') +
    '</div>';
}

function createOrderCard(order) {
  const estadoClass = {
    'pendiente': 'pendiente',
    'procesando': 'pagado',
    'enviado': 'enviado',
    'entregado': 'entregado',
    'cancelado': 'cancelado'
  }[order.estado] || 'pendiente';
  
  const estadoTexto = {
    'pendiente': 'Pendiente',
    'procesando': 'Procesando',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  }[order.estado] || 'Pendiente';
  
  const fecha = new Date(order.fecha_pedido);
  const fechaTexto = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
    <div class="admin-order-card" data-order-id="${order.id}">
      <div class="admin-order-header">
        <div>
          <div class="admin-order-id">Pedido #DP${order.id}</div>
          <div class="admin-order-date">${fechaTexto}</div>
        </div>
        <div class="admin-order-status-badge ${estadoClass}">
          ${estadoTexto}
        </div>
      </div>
      
      <div class="admin-order-customer">
        <h4>Información del Cliente</h4>
        <div class="customer-info">
          <div class="customer-info-item">
            <strong>Nombre</strong>
            ${order.usuario_nombre || 'N/A'}
          </div>
          <div class="customer-info-item">
            <strong>Email</strong>
            ${order.usuario_email || 'N/A'}
          </div>
          <div class="customer-info-item">
            <strong>Total de Items</strong>
            ${order.total_items || 0}
          </div>
          <div class="customer-info-item">
            <strong>Método de Pago</strong>
            ${formatPaymentMethod(order.metodo_pago)}
          </div>
        </div>
      </div>
      
      <div class="admin-order-totals">
        <div class="order-total-row">
          <span>Subtotal:</span>
          <span class="value">$${formatPrice(order.subtotal)}</span>
        </div>
        <div class="order-total-row">
          <span>Envío:</span>
          <span class="value">${order.envio > 0 ? '$' + formatPrice(order.envio) : 'GRATIS'}</span>
        </div>
        <div class="order-total-row">
          <span>Impuestos:</span>
          <span class="value">$${formatPrice(order.impuestos)}</span>
        </div>
        ${order.descuento > 0 ? `
        <div class="order-total-row">
          <span>Descuento:</span>
          <span class="value" style="color: #10b981;">-$${formatPrice(order.descuento)}</span>
        </div>
        ` : ''}
        <div class="order-total-row final">
          <span>Total:</span>
          <span class="value">$${formatPrice(order.total)}</span>
        </div>
      </div>
      
      <div class="admin-order-actions">
        <select class="order-status-select" id="status_${order.id}" data-order-id="${order.id}">
          <option value="pendiente" ${order.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="procesando" ${order.estado === 'procesando' ? 'selected' : ''}>Procesando</option>
          <option value="enviado" ${order.estado === 'enviado' ? 'selected' : ''}>Enviado</option>
          <option value="entregado" ${order.estado === 'entregado' ? 'selected' : ''}>Entregado</option>
          <option value="cancelado" ${order.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
        
        <button class="btn-update-status" onclick="updateOrderStatus(${order.id})">
          Actualizar Estado
        </button>
        
        <button class="btn-order-details" onclick="viewOrderDetails(${order.id})">
          Ver Detalles
        </button>
      </div>
    </div>
  `;
}

async function updateOrderStatus(orderId) {
  const selectElement = document.getElementById(`status_${orderId}`);
  
  if (!selectElement) {
    showToast('Error al obtener el estado', 'error');
    return;
  }
  
  const nuevoEstado = selectElement.value;
  
  if (!confirm(`¿Cambiar el estado del pedido #DP${orderId} a "${nuevoEstado.toUpperCase()}"?`)) {
    return;
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'update_order_status');
    formData.append('pedido_id', orderId);
    formData.append('estado', nuevoEstado);
    
    const response = await fetch('admin_actions.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Estado actualizado correctamente', 'success');
      
      const orderIndex = allOrders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        allOrders[orderIndex].estado = nuevoEstado;
      }
      
      filterOrders();
      updateOrdersStats();
    } else {
      showToast(data.message || 'Error al actualizar estado', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al actualizar estado', 'error');
  }
}

async function viewOrderDetails(orderId) {
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'get_order_detail');
    formData.append('pedido_id', orderId);

    const response = await fetch('admin_actions.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const data = await response.json();

    if (data.success && data.order) {
      showOrderDetailModal(data.order);
    } else {
      showToast(data.message || 'No se pudo cargar el detalle del pedido', 'error');
    }
  } catch (error) {
    console.error('Error al obtener detalle de pedido:', error);
    showToast('Error al cargar el detalle del pedido', 'error');
  }
}


function showOrderDetailModal(order) {
  const existingModal = document.querySelector('.order-detail-modal');
  if (existingModal) existingModal.remove();
  
  const fecha = new Date(order.fecha_pedido);
  const fechaTexto = fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const itemsHTML = order.items.map(item => `
    <div class="admin-order-item">
      <div class="admin-order-item-name">${item.producto_nombre}</div>
      <div class="admin-order-item-quantity">Cantidad: ${item.cantidad}</div>
      <div class="admin-order-item-price">$${formatPrice(item.subtotal)}</div>
    </div>
  `).join('');
  
  const modal = document.createElement('div');
  modal.className = 'admin-edit-modal order-detail-modal active';
  modal.innerHTML = `
    <div class="admin-edit-modal-content">
      <h2>Detalle del Pedido #DP${order.id}</h2>
      
      <div style="margin-bottom: 25px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
            <strong style="display: block; color: #e8c5d8; margin-bottom: 5px;">Cliente</strong>
            <div style="color: rgba(255,255,255,0.9);">${order.usuario_nombre}</div>
            <div style="color: rgba(255,255,255,0.6); font-size: 13px;">${order.usuario_email}</div>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
            <strong style="display: block; color: #e8c5d8; margin-bottom: 5px;">Fecha</strong>
            <div style="color: rgba(255,255,255,0.9);">${fechaTexto}</div>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
            <strong style="display: block; color: #e8c5d8; margin-bottom: 5px;">Estado</strong>
            <div style="color: rgba(255,255,255,0.9); text-transform: uppercase;">${order.estado}</div>
          </div>
          
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px;">
            <strong style="display: block; color: #e8c5d8; margin-bottom: 5px;">Método de Pago</strong>
            <div style="color: rgba(255,255,255,0.9);">${formatPaymentMethod(order.metodo_pago)}</div>
          </div>
        </div>
      </div>
      
      <div class="admin-order-items">
        <h4>Productos</h4>
        ${itemsHTML}
      </div>
      
      <div class="admin-order-totals">
        <div class="order-total-row">
          <span>Subtotal:</span>
          <span class="value">$${formatPrice(order.subtotal)}</span>
        </div>
        <div class="order-total-row">
          <span>Envío:</span>
          <span class="value">${order.envio > 0 ? '$' + formatPrice(order.envio) : 'GRATIS'}</span>
        </div>
        <div class="order-total-row">
          <span>Impuestos:</span>
          <span class="value">$${formatPrice(order.impuestos)}</span>
        </div>
        ${order.descuento > 0 ? `
        <div class="order-total-row">
          <span>Descuento:</span>
          <span class="value" style="color: #10b981;">-$${formatPrice(order.descuento)}</span>
        </div>
        ` : ''}
        <div class="order-total-row final">
          <span>Total:</span>
          <span class="value">$${formatPrice(order.total)}</span>
        </div>
      </div>
      
      <div class="admin-edit-modal-actions">
        <button type="button" class="admin-cancel-btn" onclick="closeOrderDetailModal()">Cerrar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeOrderDetailModal();
  });
}

function closeOrderDetailModal() {
  const modal = document.querySelector('.order-detail-modal');
  if (modal) modal.remove();
}

function filterOrders() {
  const statusFilter = document.getElementById('filterOrderStatus')?.value || '';
  const customerFilter = document.getElementById('filterOrderCustomer')?.value.toLowerCase() || '';
  const dateFromFilter = document.getElementById('filterOrderDateFrom')?.value || '';
  const dateToFilter = document.getElementById('filterOrderDateTo')?.value || '';
  
  filteredOrders = allOrders.filter(order => {
    if (statusFilter && order.estado !== statusFilter) return false;
    
    if (customerFilter) {
      const customerMatch = (
        (order.usuario_nombre || '').toLowerCase().includes(customerFilter) ||
        (order.usuario_email || '').toLowerCase().includes(customerFilter)
      );
      if (!customerMatch) return false;
    }
    
    if (dateFromFilter) {
      const orderDate = new Date(order.fecha_pedido).toISOString().split('T')[0];
      if (orderDate < dateFromFilter) return false;
    }
    
    if (dateToFilter) {
      const orderDate = new Date(order.fecha_pedido).toISOString().split('T')[0];
      if (orderDate > dateToFilter) return false;
    }
    
    return true;
  });
  
  renderOrders();
}

function updateOrdersStats() {
  const totalPedidos = allOrders.length;
  const pendientes = allOrders.filter(o => o.estado === 'pendiente').length;
  
  const statPedidos = document.getElementById('statPedidos');
  const statPendientes = document.getElementById('statPendientes');
  
  if (statPedidos) statPedidos.textContent = totalPedidos;
  if (statPendientes) statPendientes.textContent = pendientes;
}

function hideOrdersManagement() {
  const section = document.getElementById('ordersManagementSection');
  if (section) section.style.display = 'none';
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPaymentMethod(method) {
  const methods = {
    'credit_card': 'Tarjeta de Crédito',
    'debit_card': 'Tarjeta de Débito',
    'transfer': 'Transferencia',
    'mercadopago': 'Mercado Pago'
  };
  return methods[method] || method || 'N/A';
}

window.loadAllOrders = loadAllOrders;
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderDetailModal = closeOrderDetailModal;
window.filterOrders = filterOrders;
window.hideOrdersManagement = hideOrdersManagement;

