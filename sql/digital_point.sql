CREATE DATABASE IF NOT EXISTS digital_point CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE digital_point;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (nombre, apellido, email, password, rol) VALUES 
('Admin', 'Sistema', 'admin@digitalpoint.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE email = email;

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('notebook', 'monitor', 'ambos') DEFAULT 'ambos',
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categorias (nombre, tipo) VALUES 
('Gaming', 'ambos'),
('Uso Diario', 'notebook'),
('Profesionales', 'notebook'),
('Estudiantes', 'notebook'),
('Oficina', 'monitor'),
('4K', 'monitor'),
('Curvos', 'monitor'),
('Ultrawide', 'monitor')
ON DUPLICATE KEY UPDATE nombre = nombre;

CREATE TABLE IF NOT EXISTS productos (
    id VARCHAR(50) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    categoria_id INT,
    tipo ENUM('notebook', 'monitor') NOT NULL,
    descripcion TEXT,
    rating DECIMAL(2, 1) DEFAULT 0.0,
    reviews INT DEFAULT 0,
    stock INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_tipo (tipo),
    INDEX idx_precio (precio),
    INDEX idx_rating (rating),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS imagenes_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
    url_imagen VARCHAR(500) NOT NULL,
    orden INT DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_orden (orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS especificaciones_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
    badge VARCHAR(50) NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    envio DECIMAL(10, 2) DEFAULT 0.00,
    impuestos DECIMAL(10, 2) DEFAULT 0.00,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    metodo_pago VARCHAR(50) DEFAULT 'credit_card',
    fecha_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedido_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id VARCHAR(50) NOT NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    INDEX idx_pedido (pedido_id),
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ofertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id VARCHAR(50) NOT NULL,
    descuento_porcentaje INT NOT NULL,
    precio_oferta DECIMAL(10, 2) NOT NULL,
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin DATE DEFAULT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    fecha_suscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO productos (id, titulo, marca, modelo, precio, categoria_id, tipo, descripcion, rating, reviews, stock) VALUES
('notebook1', 'MSI Modern 15 A11', 'MSI', 'Modern 15 A11', 89999.00, 2, 'notebook', 'MSI Modern 15 A11 ideal para uso diario con i5-1135G7, 8GB RAM y 256GB SSD.', 4.2, 127, 15),
('notebook2', 'MSI Katana 15 B12', 'MSI', 'Katana 15 B12', 124999.00, 1, 'notebook', 'MSI Katana 15 B12 para gaming con Ryzen 5 5600H, 16GB RAM y 512GB SSD.', 4.5, 89, 8),
('notebook3', 'MSI Summit E14 Evo', 'MSI', 'Summit E14 Evo', 149999.00, 3, 'notebook', 'MSI Summit E14 Evo para profesionales con i7-1165G7, 16GB RAM y 512GB SSD.', 4.7, 156, 12),
('notebook4', 'MSI Modern 14 C12', 'MSI', 'Modern 14 C12', 94999.00, 4, 'notebook', 'MSI Modern 14 C12 para estudiantes, Ryzen 7 5700U, 8GB RAM y 256GB SSD.', 4.3, 203, 20),
('notebook5', 'MSI Modern 15 A12', 'MSI', 'Modern 15 A12', 64999.00, 2, 'notebook', 'MSI Modern 15 A12 económica y eficiente con i3-1115G4, 4GB RAM y 128GB SSD.', 3.9, 178, 25),
('notebook6', 'MSI GF63 Thin', 'MSI', 'GF63 Thin', 179999.00, 1, 'notebook', 'MSI GF63 Thin con i7-11800H, 16GB RAM, 512GB SSD y RTX 3050 (144Hz).', 4.6, 94, 6),
('notebook7', 'MSI Prestige 14 Evo', 'MSI', 'Prestige 14 Evo', 249999.00, 3, 'notebook', 'MSI Prestige 14 Evo ultraligera con gran autonomía y 256GB SSD.', 4.8, 67, 4),
('notebook8', 'MSI Prestige 13 Evo', 'MSI', 'Prestige 13 Evo', 134999.00, 3, 'notebook', 'MSI Prestige 13 Evo ultraligera con i5-1135G7, 8GB RAM y 256GB SSD.', 4.4, 112, 9),
('notebook9', 'MSI Summit E13 Flip Evo', 'MSI', 'Summit E13 Flip Evo', 119999.00, 2, 'notebook', 'MSI Summit E13 Flip Evo 2-en-1 con Ryzen 5 5500U, 16GB RAM y 512GB SSD.', 4.3, 145, 11),
('notebook10', 'MSI Pulse 15', 'MSI', 'Pulse 15', 199999.00, 1, 'notebook', 'MSI Pulse 15 gaming: Ryzen 7 5800H, 16GB RAM, 1TB SSD y RTX 3060 (165Hz).', 4.7, 73, 5);

INSERT INTO productos (id, titulo, marca, modelo, precio, categoria_id, tipo, descripcion, rating, reviews, stock) VALUES
('monitor1', 'MSI Optix G27C7 27" 240Hz QHD Curvo', 'MSI', 'Optix G27C7', 89999.00, 1, 'monitor', 'MSI Optix G27C7 curvo 27" QHD 240Hz y 1ms, ideal para eSports.', 4.5, 156, 12),
('monitor2', 'MSI Optix MAG342CQR 34" 75Hz IPS USB-C Curvo', 'MSI', 'Optix MAG342CQR', 124999.00, 5, 'monitor', 'MSI Optix MAG342CQR 34" ultrawide curvo IPS 75Hz con USB-C.', 4.3, 203, 18),
('monitor3', 'MSI Optix PG27C 27" 165Hz Curvo G-Sync Compatible', 'MSI', 'Optix PG27C', 149999.00, 1, 'monitor', 'MSI Optix PG27C 27" 165Hz curvo, IPS y G-Sync Compatible.', 4.7, 89, 7),
('monitor4', 'MSI Modern MD272Q 27" 4K IPS USB-C', 'MSI', 'Modern MD272Q', 179999.00, 6, 'monitor', 'MSI Modern MD272Q 27" 4K IPS con hub USB-C para productividad.', 4.6, 134, 9),
('monitor5', 'MSI G24C4 24" 144Hz IPS Gaming Curvo', 'MSI', 'G24C4', 64999.00, 1, 'monitor', 'MSI G24C4 24" Full HD 144Hz curvo con 1ms para gaming.', 4.2, 287, 22),
('monitor6', 'MSI Creator PS321URV 32" 4K Professional IPS', 'MSI', 'Creator PS321URV', 199999.00, 6, 'monitor', 'MSI Creator PS321URV 32" 4K IPS para diseño con color preciso.', 4.8, 67, 5),
('monitor7', 'MSI Optix MAG341CQ 34" Ultrawide Curvo', 'MSI', 'Optix MAG341CQ', 134999.00, 7, 'monitor', 'MSI Optix MAG341CQ 34" UWQHD 100Hz curvo para inmersión total.', 4.4, 123, 8),
('monitor8', 'MSI PRO MP241C 24" Empresarial IPS Curvo', 'MSI', 'PRO MP241C', 54999.00, 5, 'monitor', 'MSI PRO MP241C 24" Full HD IPS curvo con ergonomía para oficina.', 4.1, 198, 30),
('monitor9', 'MSI G27CQ4 27" 170Hz QHD KVM Curvo', 'MSI', 'G27CQ4', 94999.00, 1, 'monitor', 'MSI G27CQ4 27" QHD 170Hz IPS curvo con KVM integrado.', 4.4, 167, 14),
('monitor10', 'MSI Modern MD271QP 27" 4K IPS Entry', 'MSI', 'Modern MD271QP', 89999.00, 6, 'monitor', 'MSI Modern MD271QP 27" 4K IPS con biseles finos. Opción 4K accesible.', 4.0, 145, 16);

INSERT INTO imagenes_productos (producto_id, url_imagen, orden, es_principal) VALUES
('notebook1', 'images/Notebook/notebook1.png', 1, TRUE),
('notebook1', 'images/Notebook/notebook01.png', 2, FALSE),
('notebook1', 'images/Notebook/notebook001.png', 3, FALSE),
('notebook1', 'images/Notebook/notebook0001.png', 4, FALSE),
('notebook2', 'images/Notebook/notebook2.png', 1, TRUE),
('notebook2', 'images/Notebook/notebook02.png', 2, FALSE),
('notebook2', 'images/Notebook/notebook002.png', 3, FALSE),
('notebook2', 'images/Notebook/notebook0002.png', 4, FALSE),
('notebook3', 'images/Notebook/notebook3.png', 1, TRUE),
('notebook3', 'images/Notebook/notebook03.png', 2, FALSE),
('notebook3', 'images/Notebook/notebook003.png', 3, FALSE),
('notebook3', 'images/Notebook/notebook0003.png', 4, FALSE),
('notebook4', 'images/Notebook/notebook4.png', 1, TRUE),
('notebook4', 'images/Notebook/notebook04.png', 2, FALSE),
('notebook4', 'images/Notebook/notebook004.png', 3, FALSE),
('notebook4', 'images/Notebook/notebook0004.png', 4, FALSE),
('notebook5', 'images/Notebook/notebook5.png', 1, TRUE),
('notebook5', 'images/Notebook/notebook05.png', 2, FALSE),
('notebook5', 'images/Notebook/notebook005.png', 3, FALSE),
('notebook5', 'images/Notebook/notebook0005.png', 4, FALSE),
('notebook6', 'images/Notebook/notebook6.png', 1, TRUE),
('notebook6', 'images/Notebook/notebook06.png', 2, FALSE),
('notebook6', 'images/Notebook/notebook006.png', 3, FALSE),
('notebook6', 'images/Notebook/notebook0006.png', 4, FALSE),
('notebook7', 'images/Notebook/notebook7.png', 1, TRUE),
('notebook7', 'images/Notebook/notebook07.png', 2, FALSE),
('notebook7', 'images/Notebook/notebook007.png', 3, FALSE),
('notebook7', 'images/Notebook/notebook0007.png', 4, FALSE),
('notebook8', 'images/Notebook/notebook8.png', 1, TRUE),
('notebook8', 'images/Notebook/notebook08.png', 2, FALSE),
('notebook8', 'images/Notebook/notebook008.png', 3, FALSE),
('notebook8', 'images/Notebook/notebook0008.png', 4, FALSE),
('notebook9', 'images/Notebook/notebook9.png', 1, TRUE),
('notebook9', 'images/Notebook/notebook09.png', 2, FALSE),
('notebook9', 'images/Notebook/notebook009.png', 3, FALSE),
('notebook9', 'images/Notebook/notebook0009.png', 4, FALSE),
('notebook10', 'images/Notebook/notebook10.png', 1, TRUE),
('notebook10', 'images/Notebook/notebook010.png', 2, FALSE),
('notebook10', 'images/Notebook/notebook0010.png', 3, FALSE),
('notebook10', 'images/Notebook/notebook00010.png', 4, FALSE);

INSERT INTO imagenes_productos (producto_id, url_imagen, orden, es_principal) VALUES
('monitor1', 'images/Monitores/monitor1.png', 1, TRUE),
('monitor1', 'images/Monitores/monitor01.png', 2, FALSE),
('monitor1', 'images/Monitores/monitor001.png', 3, FALSE),
('monitor1', 'images/Monitores/monitor0001.png', 4, FALSE),
('monitor2', 'images/Monitores/monitor2.png', 1, TRUE),
('monitor2', 'images/Monitores/monitor02.png', 2, FALSE),
('monitor2', 'images/Monitores/monitor002.png', 3, FALSE),
('monitor2', 'images/Monitores/monitor0002.png', 4, FALSE),
('monitor3', 'images/Monitores/monitor3.png', 1, TRUE),
('monitor3', 'images/Monitores/monitor03.png', 2, FALSE),
('monitor3', 'images/Monitores/monitor003.png', 3, FALSE),
('monitor3', 'images/Monitores/monitor0003.png', 4, FALSE),
('monitor4', 'images/Monitores/monitor4.png', 1, TRUE),
('monitor4', 'images/Monitores/monitor04.png', 2, FALSE),
('monitor4', 'images/Monitores/monitor004.png', 3, FALSE),
('monitor4', 'images/Monitores/monitor0004.png', 4, FALSE),
('monitor5', 'images/Monitores/monitor5.png', 1, TRUE),
('monitor5', 'images/Monitores/monitor05.png', 2, FALSE),
('monitor5', 'images/Monitores/monitor005.png', 3, FALSE),
('monitor5', 'images/Monitores/monitor0005.png', 4, FALSE),
('monitor6', 'images/Monitores/monitor6.png', 1, TRUE),
('monitor6', 'images/Monitores/monitor06.png', 2, FALSE),
('monitor6', 'images/Monitores/monitor006.png', 3, FALSE),
('monitor6', 'images/Monitores/monitor0006.png', 4, FALSE),
('monitor7', 'images/Monitores/monitor7.png', 1, TRUE),
('monitor7', 'images/Monitores/monitor07.png', 2, FALSE),
('monitor7', 'images/Monitores/monitor007.png', 3, FALSE),
('monitor7', 'images/Monitores/monitor0007.png', 4, FALSE),
('monitor8', 'images/Monitores/monitor8.png', 1, TRUE),
('monitor8', 'images/Monitores/monitor08.png', 2, FALSE),
('monitor8', 'images/Monitores/monitor008.png', 3, FALSE),
('monitor8', 'images/Monitores/monitor0008.png', 4, FALSE),
('monitor9', 'images/Monitores/monitor9.png', 1, TRUE),
('monitor9', 'images/Monitores/monitor09.png', 2, FALSE),
('monitor9', 'images/Monitores/monitor009.png', 3, FALSE),
('monitor9', 'images/Monitores/monitor0009.png', 4, FALSE),
('monitor10', 'images/Monitores/monitor10.png', 1, TRUE),
('monitor10', 'images/Monitores/monitor010.png', 2, FALSE),
('monitor10', 'images/Monitores/monitor0010.png', 3, FALSE),
('monitor10', 'images/Monitores/monitor00010.png', 4, FALSE);

INSERT INTO badges (producto_id, badge) VALUES
('notebook1', 'value'),
('notebook1', 'popular'),
('notebook2', 'gaming'),
('notebook2', 'popular'),
('notebook2', 'new'),
('notebook3', 'premium'),
('notebook3', 'oficina'),
('notebook4', 'value'),
('notebook4', 'new'),
('notebook5', 'value'),
('notebook6', 'gaming'),
('notebook6', 'premium'),
('notebook6', 'popular'),
('notebook7', 'premium'),
('notebook7', 'flagship'),
('notebook8', 'premium'),
('notebook8', 'new'),
('notebook9', 'popular'),
('notebook9', 'value'),
('notebook10', 'gaming'),
('notebook10', 'premium'),
('notebook10', 'flagship'),
('monitor1', 'gaming'),
('monitor1', 'curved'),
('monitor1', 'popular'),
('monitor2', 'ultrawide'),
('monitor2', 'curved'),
('monitor2', 'oficina'),
('monitor2', 'value'),
('monitor3', 'gaming'),
('monitor3', 'premium'),
('monitor3', 'flagship'),
('monitor3', 'curved'),
('monitor4', '4k'),
('monitor4', 'premium'),
('monitor4', 'oficina'),
('monitor5', 'gaming'),
('monitor5', 'curved'),
('monitor5', 'value'),
('monitor5', 'popular'),
('monitor6', '4k'),
('monitor6', 'premium'),
('monitor6', 'flagship'),
('monitor7', 'curved'),
('monitor7', 'ultrawide'),
('monitor7', 'gaming'),
('monitor8', 'oficina'),
('monitor8', 'value'),
('monitor8', 'curved'),
('monitor9', 'gaming'),
('monitor9', 'value'),
('monitor9', 'popular'),
('monitor9', 'curved'),
('monitor10', '4k'),
('monitor10', 'value');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook1', 'Procesador', 'Intel Core i5-1135G7 (hasta 4.2GHz)'),
('notebook1', 'Memoria RAM', '8GB DDR4-3200MHz'),
('notebook1', 'Almacenamiento', '256GB SSD NVMe'),
('notebook1', 'Pantalla', '15.6" Full HD (1920x1080) Anti-reflejo'),
('notebook1', 'Tarjeta Gráfica', 'Intel Iris Xe Graphics'),
('notebook1', 'Sistema Operativo', 'Windows 11 Home'),
('notebook1', 'Conectividad', 'Wi-Fi 6 (802.11ax), Bluetooth 5.1'),
('notebook1', 'Puertos', '2x USB-A 3.2, 1x USB-C, HDMI 1.4, Jack 3.5mm'),
('notebook1', 'Batería', 'Hasta 8 horas'),
('notebook1', 'Peso', '1.83 kg'),
('notebook1', 'Dimensiones', '358.5 x 235 x 18.9 mm'),
('notebook1', 'Garantía', '1 año');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook2', 'Procesador', 'AMD Ryzen 5 5600H (hasta 4.2GHz)'),
('notebook2', 'Memoria RAM', '16GB DDR4-3200MHz'),
('notebook2', 'Almacenamiento', '512GB SSD NVMe'),
('notebook2', 'Pantalla', '15.6" Full HD IPS (1920x1080) 144Hz'),
('notebook2', 'Tarjeta Gráfica', 'NVIDIA GeForce GTX 1650 4GB'),
('notebook2', 'Sistema Operativo', 'Windows 11 Home'),
('notebook2', 'Conectividad', 'Wi-Fi 6E, Bluetooth 5.2'),
('notebook2', 'Puertos', '3x USB-A 3.2, 1x USB-C, HDMI 2.1, RJ-45'),
('notebook2', 'Batería', '6–8 horas'),
('notebook2', 'Peso', '2.25 kg'),
('notebook2', 'Dimensiones', '360 x 256 x 23.5 mm'),
('notebook2', 'Garantía', '2 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook3', 'Procesador', 'Intel Core i7-1165G7 (hasta 4.7GHz)'),
('notebook3', 'Memoria RAM', '16GB DDR4-3200MHz'),
('notebook3', 'Almacenamiento', '512GB SSD NVMe PCIe 4.0'),
('notebook3', 'Pantalla', '14" Full HD IPS (1920x1080) Anti-reflejo'),
('notebook3', 'Tarjeta Gráfica', 'Intel Iris Xe Graphics'),
('notebook3', 'Sistema Operativo', 'Windows 11 Pro'),
('notebook3', 'Conectividad', 'Wi-Fi 6, Bluetooth 5.1'),
('notebook3', 'Puertos', '2x USB-A 3.2, 2x USB-C/Thunderbolt, HDMI 2.0, RJ-45'),
('notebook3', 'Batería', 'Hasta 12 horas'),
('notebook3', 'Peso', '1.59 kg'),
('notebook3', 'Dimensiones', '324 x 220 x 17.9 mm'),
('notebook3', 'Garantía', '3 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook4', 'Procesador', 'AMD Ryzen 7 5700U (hasta 4.3GHz)'),
('notebook4', 'Memoria RAM', '8GB DDR4-3200MHz'),
('notebook4', 'Almacenamiento', '256GB SSD NVMe'),
('notebook4', 'Pantalla', '14" Full HD IPS (1920x1080)'),
('notebook4', 'Tarjeta Gráfica', 'AMD Radeon Graphics'),
('notebook4', 'Sistema Operativo', 'Windows 11 Home'),
('notebook4', 'Conectividad', 'Wi-Fi 6, Bluetooth 5.0'),
('notebook4', 'Puertos', '2x USB-A 3.2, 1x USB-C 3.2, HDMI 1.4, microSD'),
('notebook4', 'Batería', 'Hasta 9 horas'),
('notebook4', 'Peso', '1.4 kg'),
('notebook4', 'Dimensiones', '324 x 213 x 15.9 mm'),
('notebook4', 'Garantía', '2 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook5', 'Procesador', 'Intel Core i3-1115G4 (hasta 4.1GHz)'),
('notebook5', 'Memoria RAM', '4GB DDR4-2666MHz (expandible)'),
('notebook5', 'Almacenamiento', '128GB SSD NVMe'),
('notebook5', 'Pantalla', '15.6" Full HD (1920x1080)'),
('notebook5', 'Tarjeta Gráfica', 'Intel UHD Graphics'),
('notebook5', 'Sistema Operativo', 'Windows 11 Home S'),
('notebook5', 'Conectividad', 'Wi-Fi 5, Bluetooth 5.0'),
('notebook5', 'Puertos', '2x USB-A 3.2, 1x USB-A 2.0, 1x USB-C, HDMI 1.4, RJ-45'),
('notebook5', 'Batería', 'Hasta 7 horas'),
('notebook5', 'Peso', '1.9 kg'),
('notebook5', 'Dimensiones', '363 x 238 x 17.95 mm'),
('notebook5', 'Garantía', '1 año');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook6', 'Procesador', 'Intel Core i7-11800H (hasta 4.6GHz)'),
('notebook6', 'Memoria RAM', '16GB DDR4-3200MHz (2x8GB)'),
('notebook6', 'Almacenamiento', '512GB SSD NVMe'),
('notebook6', 'Pantalla', '15.6" Full HD IPS 144Hz'),
('notebook6', 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 3050 4GB'),
('notebook6', 'Sistema Operativo', 'Windows 11 Home'),
('notebook6', 'Conectividad', 'Wi-Fi 6E, Bluetooth 5.2'),
('notebook6', 'Puertos', '3x USB-A, 1x USB-C, HDMI 2.0, RJ-45'),
('notebook6', 'Batería', '5–7 horas'),
('notebook6', 'Peso', '1.86 kg'),
('notebook6', 'Dimensiones', '359 x 254 x 21.7 mm'),
('notebook6', 'Garantía', '2 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook7', 'Procesador', 'Apple M2 / Intel Evo equivalente'),
('notebook7', 'Memoria RAM', '8GB'),
('notebook7', 'Almacenamiento', '256GB SSD'),
('notebook7', 'Pantalla', '14" Full HD / QHD (según variante)'),
('notebook7', 'Tarjeta Gráfica', 'Integrada'),
('notebook7', 'Sistema Operativo', 'Windows 11 / equivalente'),
('notebook7', 'Conectividad', 'Wi-Fi 6, Bluetooth 5'),
('notebook7', 'Puertos', 'Thunderbolt/USB-C, USB-A, Jack 3.5mm'),
('notebook7', 'Batería', 'Hasta 18 horas'),
('notebook7', 'Peso', '≈1.2–1.3 kg'),
('notebook7', 'Dimensiones', 'Compactas'),
('notebook7', 'Garantía', '1 año');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook8', 'Procesador', 'Intel Core i5-1135G7 (hasta 4.2GHz)'),
('notebook8', 'Memoria RAM', '8GB LPDDR4X'),
('notebook8', 'Almacenamiento', '256GB SSD NVMe'),
('notebook8', 'Pantalla', '13.3" (1920x1080) alta calidad'),
('notebook8', 'Tarjeta Gráfica', 'Intel Iris Xe'),
('notebook8', 'Sistema Operativo', 'Windows 11 Home'),
('notebook8', 'Conectividad', 'Wi-Fi 6E, Bluetooth 5.1'),
('notebook8', 'Puertos', '2x Thunderbolt 4, 1x USB-A, microSD'),
('notebook8', 'Batería', 'Hasta 20 horas'),
('notebook8', 'Peso', '0.87 kg'),
('notebook8', 'Dimensiones', 'Compactas'),
('notebook8', 'Garantía', '2 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook9', 'Procesador', 'AMD Ryzen 5 5500U (hasta 4.0GHz)'),
('notebook9', 'Memoria RAM', '16GB DDR4-3200MHz'),
('notebook9', 'Almacenamiento', '512GB SSD NVMe'),
('notebook9', 'Pantalla', '13" táctil convertible 360°'),
('notebook9', 'Tarjeta Gráfica', 'Integrada'),
('notebook9', 'Sistema Operativo', 'Windows 11 Home'),
('notebook9', 'Conectividad', 'Wi-Fi 6, Bluetooth 5.2'),
('notebook9', 'Puertos', 'USB-A, USB-C 3.2, HDMI 2.0, microSD'),
('notebook9', 'Batería', 'Hasta 11 horas'),
('notebook9', 'Peso', 'Ligera'),
('notebook9', 'Dimensiones', 'Compactas'),
('notebook9', 'Garantía', '2 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('notebook10', 'Procesador', 'AMD Ryzen 7 5800H (hasta 4.4GHz)'),
('notebook10', 'Memoria RAM', '16GB DDR4-3200MHz (expandible a 32GB)'),
('notebook10', 'Almacenamiento', '1TB SSD NVMe'),
('notebook10', 'Pantalla', '15.6" Full HD IPS 165Hz G-Sync'),
('notebook10', 'Tarjeta Gráfica', 'NVIDIA GeForce RTX 3060 6GB'),
('notebook10', 'Sistema Operativo', 'Windows 11 Home'),
('notebook10', 'Conectividad', 'Wi-Fi 6E, Bluetooth 5.1, Ethernet'),
('notebook10', 'Puertos', '4x USB-A, 1x USB-C, HDMI 2.1, RJ-45'),
('notebook10', 'Batería', '4–8 horas'),
('notebook10', 'Peso', '≈2.4 kg'),
('notebook10', 'Dimensiones', 'Acorde al modelo'),
('notebook10', 'Garantía', '3 años');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor1', 'Tamaño', '27 pulgadas'),
('monitor1', 'Resolución', '2560x1440 (QHD)'),
('monitor1', 'Frecuencia', '240Hz'),
('monitor1', 'Panel', 'VA curvo'),
('monitor1', 'Tiempo de respuesta', '1ms (MPRT)'),
('monitor1', 'Conectividad', 'HDMI, DP, USB'),
('monitor1', 'Ajustes', 'Altura, inclinación, giro'),
('monitor1', 'Compatibilidad', 'FreeSync / G-Sync compatible');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor2', 'Tamaño', '34 pulgadas'),
('monitor2', 'Resolución', '3440x1440 (UWQHD)'),
('monitor2', 'Frecuencia', '75Hz'),
('monitor2', 'Panel', 'IPS curvo'),
('monitor2', 'Tiempo de respuesta', '5ms'),
('monitor2', 'Conectividad', 'USB-C (PD), HDMI, DP, USB'),
('monitor2', 'Ajustes', 'Altura, inclinación'),
('monitor2', 'Extras', 'Ultrawide 21:9');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor3', 'Tamaño', '27 pulgadas'),
('monitor3', 'Resolución', '2560x1440 (QHD)'),
('monitor3', 'Frecuencia', '165Hz'),
('monitor3', 'Panel', 'IPS curvo'),
('monitor3', 'Tiempo de respuesta', '4ms (GtG)'),
('monitor3', 'Conectividad', 'HDMI, DP, USB'),
('monitor3', 'Ajustes', 'Altura, inclinación, giro, pivot');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor4', 'Tamaño', '27 pulgadas'),
('monitor4', 'Resolución', '3840x2160 (4K UHD)'),
('monitor4', 'Frecuencia', '60Hz'),
('monitor4', 'Panel', 'IPS'),
('monitor4', 'Tiempo de respuesta', '5–8ms'),
('monitor4', 'Conectividad', 'USB-C (PD), HDMI, DP, USB'),
('monitor4', 'Ajustes', 'Altura, inclinación, giro, pivot');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor5', 'Tamaño', '24 pulgadas'),
('monitor5', 'Resolución', '1920x1080 (Full HD)'),
('monitor5', 'Frecuencia', '144Hz'),
('monitor5', 'Panel', 'IPS curvo'),
('monitor5', 'Tiempo de respuesta', '1ms (MPRT)'),
('monitor5', 'Conectividad', 'HDMI, DP, USB'),
('monitor5', 'Ajustes', 'Altura, inclinación');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor6', 'Tamaño', '32 pulgadas'),
('monitor6', 'Resolución', '3840x2160 (4K UHD)'),
('monitor6', 'Frecuencia', '60Hz'),
('monitor6', 'Panel', 'IPS'),
('monitor6', 'Tiempo de respuesta', '4ms (GtG)'),
('monitor6', 'Conectividad', 'HDMI, DP, USB'),
('monitor6', 'Ajustes', 'Altura, inclinación, giro, pivot');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor7', 'Tamaño', '34 pulgadas'),
('monitor7', 'Resolución', '3440x1440 (UWQHD)'),
('monitor7', 'Frecuencia', '100Hz'),
('monitor7', 'Panel', 'VA curvo (1500R)'),
('monitor7', 'Tiempo de respuesta', '1ms (MPRT)'),
('monitor7', 'Conectividad', 'HDMI, DP, USB'),
('monitor7', 'Ajustes', 'Altura, inclinación');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor8', 'Tamaño', '24 pulgadas'),
('monitor8', 'Resolución', '1920x1080 (Full HD)'),
('monitor8', 'Frecuencia', '60Hz'),
('monitor8', 'Panel', 'IPS curvo'),
('monitor8', 'Tiempo de respuesta', '5ms (GtG)'),
('monitor8', 'Conectividad', 'HDMI, DP, VGA, USB'),
('monitor8', 'Ajustes', 'Altura, inclinación, giro, pivot');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor9', 'Tamaño', '27 pulgadas'),
('monitor9', 'Resolución', '2560x1440 (QHD)'),
('monitor9', 'Frecuencia', '170Hz'),
('monitor9', 'Panel', 'IPS curvo'),
('monitor9', 'Tiempo de respuesta', '1ms (MPRT)'),
('monitor9', 'Conectividad', 'HDMI, DP, USB, USB-C'),
('monitor9', 'Ajustes', 'Altura, inclinación');

INSERT INTO especificaciones_productos (producto_id, clave, valor) VALUES
('monitor10', 'Tamaño', '27 pulgadas'),
('monitor10', 'Resolución', '3840x2160 (4K UHD)'),
('monitor10', 'Frecuencia', '60Hz'),
('monitor10', 'Panel', 'IPS'),
('monitor10', 'Tiempo de respuesta', '4ms (GtG)'),
('monitor10', 'Conectividad', 'HDMI, DP'),
('monitor10', 'Ajustes', 'Inclinación');

INSERT INTO ofertas (producto_id, descuento_porcentaje, precio_oferta, fecha_inicio, fecha_fin, activo) VALUES
('notebook1', 20,  71999.00, CURDATE(), NULL, TRUE),
('notebook6', 15, 152999.00, CURDATE(), NULL, TRUE),
('notebook10',25, 149999.00, CURDATE(), NULL, TRUE),
('monitor1',  30,  62999.00, CURDATE(), NULL, TRUE),
('monitor4',  18, 147599.00, CURDATE(), NULL, TRUE),
('monitor5',  35,  42249.00, CURDATE(), NULL, TRUE);
