<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Perfil - Digital Point</title>
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/pages/profile.css">
    <link rel="stylesheet" href="css/admin_controls.css">
</head>
<body data-user-role="<?php 
    session_start();
    echo isset($_SESSION['usuario']) 
        ? htmlspecialchars($_SESSION['usuario']['rol']) 
        : 'guest';
?>">
    <?php include 'includes/header.php'; ?>
    
    <div class="breadcrumbs">
        <div class="container">
            <a href="index.php">Home</a>
            <span class="separator">/</span>
            <span>Mi Perfil</span>
        </div>
    </div>

    <main class="main-content">
        <div class="container">
            <div class="profile-container">
                
                <div class="profile-header">
                    <div class="profile-photo-section">
                        <div class="profile-photo-wrapper">
                            <img src="images/icons/perfil.png" alt="Foto de perfil" id="profilePhoto" class="profile-photo">
                            <div class="photo-overlay">
                                <label for="photoUpload" class="change-photo-btn">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    <span>Cambiar Foto</span>
                                </label>
                                <input type="file" id="photoUpload" accept="image/*" style="display: none;">
                            </div>
                        </div>
                    </div>
                    <div class="profile-info">
                        <h1 id="profileName">Tu Nombre</h1>
                        <p class="profile-email" id="profileEmail">tu@email.com</p>
                        <p class="profile-member-since">Miembro desde <span id="memberSince">2025</span></p>
                        <span id="adminBadge" class="admin-badge-header" style="display: none;">
                            ADMINISTRADOR
                        </span>
                    </div>
                </div>

                <div class="profile-tabs">
                    <button class="tab-btn active" data-tab="personal" aria-label="Información personal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Información Personal
                    </button>
                    
                    <button class="tab-btn" data-tab="security" aria-label="Seguridad">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Seguridad
                    </button>
                    
                    <button class="tab-btn" data-tab="orders" aria-label="Mis pedidos">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        Mis Pedidos
                    </button>
                    
                    <button class="tab-btn admin-only" data-tab="admin" aria-label="Panel Admin" style="display: none;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                        Panel Admin
                        <span id="adminBadgeTab" class="admin-badge" style="margin-left: 8px;">ADMIN</span>
                    </button>
                </div>

                <div class="tab-content active" id="personalTab">
                    <div class="content-card">
                        <h2>Información Personal</h2>
                        <form id="personalInfoForm" class="profile-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="editFirstName">Nombre *</label>
                                    <input type="text" id="editFirstName" name="firstName" autocomplete="given-name" required>
                                </div>
                                <div class="form-group">
                                    <label for="editLastName">Apellido *</label>
                                    <input type="text" id="editLastName" name="lastName" autocomplete="family-name" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="editEmail">Email *</label>
                                <input type="email" id="editEmail" name="email" autocomplete="email" required>
                            </div>
                            <div class="form-group">
                                <label for="editPhone">Teléfono</label>
                                <input type="tel" id="editPhone" name="phone" autocomplete="tel" placeholder="+54 9 11 1234-5678">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <span>Guardar Cambios</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="tab-content" id="securityTab">
                    <div class="content-card">
                        <h2>Cambiar Contraseña</h2>
                        <form id="changePasswordForm" class="profile-form">
                            <div class="form-group">
                                <label for="currentPassword">Contraseña Actual *</label>
                                <input type="password" id="currentPassword" name="currentPassword" autocomplete="current-password" required>
                            </div>
                            <div class="form-group">
                                <label for="newPassword">Nueva Contraseña *</label>
                                <input type="password" id="newPassword" name="newPassword" autocomplete="new-password" minlength="6" required>
                                <small class="form-help">Mínimo 6 caracteres</small>
                            </div>
                            <div class="form-group">
                                <label for="confirmNewPassword">Confirmar Nueva Contraseña *</label>
                                <input type="password" id="confirmNewPassword" name="confirmNewPassword" autocomplete="new-password" required>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <span>Actualizar Contraseña</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="tab-content" id="ordersTab">
                    <div class="content-card">
                        <h2>Mis Pedidos</h2>
                        <div id="ordersList" class="orders-list"></div>
                    </div>
                </div>

                <div class="tab-content admin-only" id="adminTab" style="display: none;">
                    
                    <div class="admin-stats">
                        <div class="stat-card">
                            <h3>Productos</h3>
                            <p id="statProductos">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Usuarios</h3>
                            <p id="statUsuarios">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Ofertas</h3>
                            <p id="statOfertas">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Pedidos</h3>
                            <p id="statPedidos">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Pendientes</h3>
                            <p id="statPendientes" style="color: #fbbf24;">0</p>
                        </div>
                    </div>
                    <div class="admin-actions-grid">
                        <button class="admin-action-btn" onclick="toggleAdminMode()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>Modo Edición</span>
                        </button>

                        <button class="admin-action-btn" onclick="openAddProductModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span>Agregar Producto</span>
                        </button>

                        <button class="admin-action-btn" onclick="openAddOfferModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                            <span>Crear Oferta</span>
                        </button>

                        <button class="admin-action-btn" onclick="viewAllOffers()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>Ver Ofertas</span>
                        </button>

                        <button class="admin-action-btn" onclick="viewAllUsers()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>Ver Usuarios</span>
                        </button>

                        <button class="admin-action-btn" onclick="loadAllOrders()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                            <span>Gestionar Pedidos</span>
                        </button>
                    </div>
                    <div id="ordersManagementSection" style="display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">
                            <h3 style="color: #e8c5d8; font-size: 1.8rem; font-weight: 700; margin: 0;">
                                Gestión de Pedidos
                            </h3>
                            <button class="admin-action-btn" onclick="hideOrdersManagement()" style="padding: 10px 20px;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span>Cerrar</span>
                            </button>
                        </div>
                        <div class="orders-filter-bar">
                            <div class="filter-group">
                                <label>Estado</label>
                                <select id="filterOrderStatus" onchange="filterOrders()">
                                    <option value="">Todos</option>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="procesando">Procesando</option>
                                    <option value="enviado">Enviado</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                            </div>

                            <div class="filter-group">
                                <label>Buscar por cliente</label>
                                <input type="text" id="filterOrderCustomer" placeholder="Nombre o email" oninput="filterOrders()">
                            </div>

                            <div class="filter-group">
                                <label>Desde</label>
                                <input type="date" id="filterOrderDateFrom" onchange="filterOrders()">
                            </div>

                            <div class="filter-group">
                                <label>Hasta</label>
                                <input type="date" id="filterOrderDateTo" onchange="filterOrders()">
                            </div>
                        </div>
                        <div id="ordersListContainer">
                            <div class="loading-orders">
                                <div class="spinner"></div>
                            </div>
                        </div>
                    </div>

                    <div class="admin-info">
                        <h4>Guía Rápida</h4>
                        <p><strong>Modo Edición:</strong> Activa controles de edición en todas las páginas del sitio.</p>
                        <p><strong>Agregar Producto:</strong> Crea nuevos productos directamente desde aquí.</p>
                        <p><strong>Gestionar Pedidos:</strong> Visualiza y actualiza el estado de todos los pedidos.</p>
                        <p><strong>Atajo de teclado:</strong> Presiona <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>E</kbd> para activar/desactivar el modo edición.</p>
                    </div>

                </div>

                <div class="logout-section">
                    <button class="btn-logout" id="logoutBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>

            </div>
        </div>
    </main>

    <?php include 'includes/footer.php'; ?>

    <script src="js/pages/common_cart.js"></script>
    <script src="js/global.js"></script>
    <script src="js/api/productos_api.js"></script>
    <script src="js/pages/login.js"></script>
    <script src="js/components.js"></script>
    <script src="js/admin_controls.js"></script>
</body>
</html>