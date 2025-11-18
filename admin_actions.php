<?php
require_once 'includes/config.php';

header('Content-Type: application/json; charset=utf-8');

$rawInput = file_get_contents('php://input');
if (!empty($rawInput) && stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $jsonData = json_decode($rawInput, true);
    if (is_array($jsonData)) {
        foreach ($jsonData as $k => $v) {
            if (!isset($_POST[$k])) {
                $_POST[$k] = $v;
            }
        }
    }
}

function getCategoriaIdByNombre(?string $nombre): ?int {
    if (!$nombre) return null;
    global $pdo;

    $stmt = $pdo->prepare("SELECT id FROM categorias WHERE nombre = ? LIMIT 1");
    $stmt->execute([$nombre]);
    $id = $stmt->fetchColumn();

    if ($id) return (int)$id;

    $stmt = $pdo->prepare("INSERT INTO categorias (nombre, tipo) VALUES (?, 'ambos')");
    $stmt->execute([$nombre]);

    return (int)$pdo->lastInsertId();
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    case 'register_user':
        $nombre = trim($_POST['nombre'] ?? '');
        $apellido = trim($_POST['apellido'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$nombre || !$apellido || !$email || !$password) {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
            exit;
        }

        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
            exit;
        }

        try {
            $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmtCheck->execute([$email]);
            if ($stmtCheck->fetchColumn()) {
                echo json_encode(['success' => false, 'message' => 'Este email ya está registrado']);
                exit;
            }

            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare("
                INSERT INTO usuarios (nombre, apellido, email, password, rol, fecha_registro)
                VALUES (?, ?, ?, ?, 'usuario', NOW())
            ");
            $stmt->execute([$nombre, $apellido, $email, $passwordHash]);

            $userId = $pdo->lastInsertId();

            echo json_encode([
                'success' => true,
                'message' => 'Usuario registrado correctamente',
                'user_id' => $userId
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al registrar: ' . $e->getMessage()]);
        }
        break;

    case 'login_user':
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$email || !$password) {
            echo json_encode(['success' => false, 'message' => 'Email y contraseña requeridos']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                exit;
            }

            if (password_verify($password, $user['password'])) {
                unset($user['password']);

                echo json_encode([
                    'success' => true,
                    'message' => 'Login exitoso',
                    'user' => $user
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al verificar login: ' . $e->getMessage()]);
        }
        break;

    case 'check_email_exists':
        $email = trim($_POST['email'] ?? '');

        if (!$email) {
            echo json_encode(['success' => false, 'message' => 'Email requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $exists = $stmt->fetchColumn() !== false;

            echo json_encode(['success' => true, 'exists' => $exists]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'create_order':
        $usuarioId = (int)($_POST['usuario_id'] ?? 0);
        $items = json_decode($_POST['items'] ?? '[]', true);
        $total = (float)($_POST['total'] ?? 0);
        $subtotal = (float)($_POST['subtotal'] ?? 0);
        $envio = (float)($_POST['envio'] ?? 0);
        $impuestos = (float)($_POST['impuestos'] ?? 0);
        $descuento = (float)($_POST['descuento'] ?? 0);
        $metodoPago = $_POST['metodo_pago'] ?? 'credit_card';
        
        if ($usuarioId <= 0 || empty($items) || $total <= 0) {
            echo json_encode(['success' => false, 'message' => 'Datos de pedido inválidos']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO pedidos (usuario_id, total, subtotal, envio, impuestos, descuento, estado, metodo_pago, fecha_pedido)
                VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, NOW())
            ");
            $stmt->execute([$usuarioId, $total, $subtotal, $envio, $impuestos, $descuento, $metodoPago]);

            $pedidoId = $pdo->lastInsertId();

            $stmtItem = $pdo->prepare("
                INSERT INTO pedido_items (pedido_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($items as $item) {
                $itemSubtotal = $item['quantity'] * $item['price'];
                $stmtItem->execute([
                    $pedidoId,
                    $item['id'],
                    $item['name'],
                    $item['quantity'],
                    $item['price'],
                    $itemSubtotal
                ]);
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Pedido creado correctamente',
                'pedido_id' => $pedidoId
            ]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'Error al crear pedido: ' . $e->getMessage()]);
        }
        break;

    case 'get_all_orders':
        try {
            $stmt = $pdo->query("
                SELECT 
                    p.id,
                    p.usuario_id,
                    CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
                    u.email as usuario_email,
                    p.total,
                    p.subtotal,
                    p.envio,
                    p.impuestos,
                    p.descuento,
                    p.estado,
                    p.metodo_pago,
                    p.fecha_pedido,
                    COUNT(pi.id) as total_items
                FROM pedidos p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                LEFT JOIN pedido_items pi ON p.id = pi.pedido_id
                GROUP BY p.id
                ORDER BY p.fecha_pedido DESC
            ");
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'orders' => $orders]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'get_user_orders':
        $usuarioId = (int)($_POST['usuario_id'] ?? $_GET['usuario_id'] ?? 0);

        if ($usuarioId <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                SELECT 
                    p.id,
                    p.total,
                    p.subtotal,
                    p.envio,
                    p.impuestos,
                    p.descuento,
                    p.estado,
                    p.metodo_pago,
                    p.fecha_pedido
                FROM pedidos p
                WHERE p.usuario_id = ?
                ORDER BY p.fecha_pedido DESC
            ");
            $stmt->execute([$usuarioId]);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($orders as &$order) {
                $stmtItems = $pdo->prepare("
                    SELECT 
                        producto_id,
                        producto_nombre,
                        cantidad,
                        precio_unitario,
                        subtotal
                    FROM pedido_items
                    WHERE pedido_id = ?
                ");
                $stmtItems->execute([$order['id']]);
                $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
            }

            echo json_encode(['success' => true, 'orders' => $orders]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'get_order_detail':
        $pedidoId = (int)($_POST['pedido_id'] ?? $_GET['pedido_id'] ?? 0);

        if ($pedidoId <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de pedido requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                SELECT 
                    p.*,
                    CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
                    u.email as usuario_email
                FROM pedidos p
                LEFT JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = ?
            ");
            $stmt->execute([$pedidoId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
                exit;
            }

            $stmtItems = $pdo->prepare("
                SELECT 
                    pi.producto_id,
                    pi.producto_nombre,
                    pi.cantidad,
                    pi.precio_unitario,
                    pi.subtotal
                FROM pedido_items pi
                WHERE pi.pedido_id = ?
            ");
            $stmtItems->execute([$pedidoId]);
            $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'order' => $order]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'update_order_status':
        $pedidoId = (int)($_POST['pedido_id'] ?? 0);
        $nuevoEstado = trim($_POST['estado'] ?? '');

        $estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        
        if ($pedidoId <= 0 || !in_array($nuevoEstado, $estadosValidos)) {
            echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE pedidos SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?");
            $stmt->execute([$nuevoEstado, $pedidoId]);

            echo json_encode([
                'success' => true,
                'message' => 'Estado actualizado a: ' . $nuevoEstado
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        break;

    case 'update_product':
        $id = $_POST['id'] ?? '';
        if ($id === '') {
            echo json_encode(['success' => false, 'message' => 'ID de producto requerido']);
            exit;
        }

        $title = trim($_POST['title'] ?? '');
        $brand = trim($_POST['brand'] ?? '');
        $model = trim($_POST['model'] ?? '');
        $price = $_POST['price'] ?? '';
        $description = trim($_POST['description'] ?? '');
        $stockRaw = $_POST['stock'] ?? null;
        $category = trim($_POST['category'] ?? '');
        $type = $_POST['type'] ?? '';
        $imageUrl = trim($_POST['image'] ?? '');

        $campos = [];
        $params = [':id' => $id];

        if ($title !== '') {
            $campos[] = 'titulo = :titulo';
            $params[':titulo'] = $title;
        }
        if ($brand !== '') {
            $campos[] = 'marca = :marca';
            $params[':marca'] = $brand;
        }
        if ($model !== '') {
            $campos[] = 'modelo = :modelo';
            $params[':modelo'] = $model;
        }
        if ($price !== '' && $price !== null) {
            $campos[] = 'precio = :precio';
            $params[':precio'] = $price;
        }
        if ($description !== '') {
            $campos[] = 'descripcion = :descripcion';
            $params[':descripcion'] = $description;
        }
        if ($stockRaw !== null && $stockRaw !== '') {
            $stock = (int)$stockRaw;
            $campos[] = 'stock = :stock';
            $params[':stock'] = $stock;
        }
        if ($type !== '') {
            $campos[] = 'tipo = :tipo';
            $params[':tipo'] = $type;
        }
        if ($category !== '') {
            $categoriaId = getCategoriaIdByNombre($category);
            $campos[] = 'categoria_id = :categoria_id';
            $params[':categoria_id'] = $categoriaId;
        }

        if (empty($campos) && $imageUrl === '') {
            echo json_encode(['success' => false, 'message' => 'No hay datos para actualizar']);
            exit;
        }

        try {
            if (!empty($campos)) {
                $sql = "UPDATE productos SET " . implode(', ', $campos) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }

            if ($imageUrl !== '') {
                $stmtImg = $pdo->prepare("SELECT id FROM imagenes_productos WHERE producto_id = ? AND es_principal = 1 LIMIT 1");
                $stmtImg->execute([$id]);
                $imgId = $stmtImg->fetchColumn();

                if ($imgId) {
                    $stmtUpd = $pdo->prepare("UPDATE imagenes_productos SET url_imagen = ? WHERE id = ?");
                    $stmtUpd->execute([$imageUrl, $imgId]);
                } else {
                    $pdo->prepare("UPDATE imagenes_productos SET es_principal = 0 WHERE producto_id = ?")->execute([$id]);
                    $stmtNew = $pdo->prepare("
                        INSERT INTO imagenes_productos (producto_id, url_imagen, orden, es_principal)
                        VALUES (?, ?, 1, 1)
                    ");
                    $stmtNew->execute([$id, $imageUrl]);
                }
            }

            echo json_encode(['success' => true, 'message' => 'Producto actualizado correctamente']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()]);
        }
        break;

    case 'delete_product':
        $id = $_POST['id'] ?? '';

        if ($id === '') {
            echo json_encode(['success' => false, 'message' => 'ID de producto requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM productos WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Producto eliminado correctamente']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar: ' . $e->getMessage()]);
        }
        break;

    case 'add_product':
        $id = trim($_POST['id'] ?? '');
        $title = trim($_POST['title'] ?? '');
        $brand = trim($_POST['brand'] ?? 'MSI');
        $model = trim($_POST['model'] ?? '');
        $price = $_POST['price'] ?? '';
        $description = trim($_POST['description'] ?? '');
        $stock = (int)($_POST['stock'] ?? 0);
        $category = trim($_POST['category'] ?? '');
        $type = $_POST['type'] ?? '';
        $imageUrl = trim($_POST['image'] ?? '');

        if ($id === '' || $title === '' || $price === '' || $type === '') {
            echo json_encode(['success' => false, 'message' => 'ID, título, precio y tipo son obligatorios']);
            exit;
        }

        try {
            $categoriaId = getCategoriaIdByNombre($category);

            $stmt = $pdo->prepare("
                INSERT INTO productos (id, titulo, marca, modelo, precio, categoria_id, tipo, descripcion, rating, reviews, stock, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.0, 0, ?, 1)
            ");
            $stmt->execute([
                $id,
                $title,
                $brand,
                $model,
                $price,
                $categoriaId,
                $type,
                $description,
                $stock
            ]);

            if ($imageUrl !== '') {
                $stmtImg = $pdo->prepare("
                    INSERT INTO imagenes_productos (producto_id, url_imagen, orden, es_principal)
                    VALUES (?, ?, 1, 1)
                ");
                $stmtImg->execute([$id, $imageUrl]);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Producto agregado correctamente',
                'id' => $id
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al agregar: ' . $e->getMessage()]);
        }
        break;

    case 'add_offer':
        $productoId = trim($_POST['producto_id'] ?? '');
        $descuento = (int)($_POST['descuento'] ?? 0);
        $activo = (int)($_POST['activo'] ?? 1);

        if ($productoId === '' || $descuento <= 0 || $descuento > 99) {
            echo json_encode(['success' => false, 'message' => 'Datos de oferta inválidos']);
            exit;
        }

        try {
            $stmtCheck = $pdo->prepare("SELECT id, precio FROM productos WHERE id = ? LIMIT 1");
            $stmtCheck->execute([$productoId]);
            $producto = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$producto) {
                echo json_encode(['success' => false, 'message' => 'El producto no existe']);
                exit;
            }

            $stmtExists = $pdo->prepare("SELECT id FROM ofertas WHERE producto_id = ? LIMIT 1");
            $stmtExists->execute([$productoId]);
            if ($stmtExists->fetchColumn()) {
                echo json_encode(['success' => false, 'message' => 'Ya existe una oferta para este producto']);
                exit;
            }

            $precioOriginal = $producto['precio'];
            $precioOferta = $precioOriginal - ($precioOriginal * ($descuento / 100));

            $stmt = $pdo->prepare("
                INSERT INTO ofertas (producto_id, descuento_porcentaje, precio_oferta, fecha_inicio, activo)
                VALUES (?, ?, ?, CURDATE(), ?)
            ");
            $stmt->execute([$productoId, $descuento, $precioOferta, $activo]);

            echo json_encode([
                'success' => true,
                'message' => 'Oferta agregada correctamente',
                'id' => $pdo->lastInsertId()
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al agregar oferta: ' . $e->getMessage()]);
        }
        break;

    case 'update_offer':
        $id = (int)($_POST['id'] ?? 0);
        $descuento = (int)($_POST['descuento'] ?? 0);
        $activo = (int)($_POST['activo'] ?? 1);

        if ($id <= 0 || $descuento <= 0 || $descuento > 99) {
            echo json_encode(['success' => false, 'message' => 'Datos de oferta inválidos']);
            exit;
        }

        try {
            $stmtGet = $pdo->prepare("
                SELECT o.producto_id, p.precio 
                FROM ofertas o
                JOIN productos p ON o.producto_id = p.id
                WHERE o.id = ?
            ");
            $stmtGet->execute([$id]);
            $data = $stmtGet->fetch(PDO::FETCH_ASSOC);

            if (!$data) {
                echo json_encode(['success' => false, 'message' => 'Oferta no encontrada']);
                exit;
            }

            $precioOriginal = $data['precio'];
            $precioOferta = $precioOriginal - ($precioOriginal * ($descuento / 100));

            $stmt = $pdo->prepare("
                UPDATE ofertas 
                SET descuento_porcentaje = ?, precio_oferta = ?, activo = ? 
                WHERE id = ?
            ");
            $stmt->execute([$descuento, $precioOferta, $activo, $id]);

            echo json_encode(['success' => true, 'message' => 'Oferta actualizada correctamente']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar oferta: ' . $e->getMessage()]);
        }
        break;

    case 'delete_offer':
        $id = (int)($_POST['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de oferta requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM ofertas WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'Oferta eliminada correctamente']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar oferta: ' . $e->getMessage()]);
        }
        break;

    case 'toggle_offer':
        $id = (int)($_POST['id'] ?? 0);

        if ($id <= 0) {
            echo json_encode(['success' => false, 'message' => 'ID de oferta requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT activo FROM ofertas WHERE id = ?");
            $stmt->execute([$id]);
            $activoActual = $stmt->fetchColumn();

            if ($activoActual === false) {
                echo json_encode(['success' => false, 'message' => 'Oferta no encontrada']);
                exit;
            }

            $nuevoEstado = $activoActual == 1 ? 0 : 1;

            $stmtUpd = $pdo->prepare("UPDATE ofertas SET activo = ? WHERE id = ?");
            $stmtUpd->execute([$nuevoEstado, $id]);

            echo json_encode([
                'success' => true,
                'message' => 'Estado actualizado a ' . ($nuevoEstado ? 'activa' : 'inactiva')
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar estado: ' . $e->getMessage()]);
        }
        break;

    case 'get_offers':
        try {
            $stmt = $pdo->query("
                SELECT 
                    o.id, 
                    o.producto_id, 
                    o.descuento_porcentaje as descuento, 
                    o.precio_oferta,
                    o.activo, 
                    o.fecha_inicio,
                    o.fecha_fin,
                    p.titulo as producto_titulo,
                    p.precio as precio_original
                FROM ofertas o
                LEFT JOIN productos p ON o.producto_id = p.id
                ORDER BY o.id DESC
            ");
            $offers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'offers' => $offers]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al obtener ofertas: ' . $e->getMessage()]);
        }
        break;

    case 'get_users':
        try {
            $stmt = $pdo->query("
                SELECT id, nombre, apellido, email, rol, fecha_registro, telefono
                FROM usuarios
                ORDER BY fecha_registro DESC
            ");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'users' => $users]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al obtener usuarios: ' . $e->getMessage()]);
        }
        break;

    case 'toggle_admin':
        $id = $_POST['id'] ?? '';

        if ($id === '') {
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT rol FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $rolActual = $stmt->fetchColumn();

            if (!$rolActual) {
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                exit;
            }

            $nuevoRol = ($rolActual === 'admin') ? 'usuario' : 'admin';

            $stmtUpd = $pdo->prepare("UPDATE usuarios SET rol = ? WHERE id = ?");
            $stmtUpd->execute([$nuevoRol, $id]);

            echo json_encode(['success' => true, 'message' => 'Rol actualizado a ' . $nuevoRol]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar rol: ' . $e->getMessage()]);
        }
        break;

    case 'get_stats':
        try {
            $totalProductos = (int)$pdo->query("SELECT COUNT(*) FROM productos WHERE activo = 1")->fetchColumn();
            $totalUsuarios = (int)$pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
            $totalOfertas = (int)$pdo->query("SELECT COUNT(*) FROM ofertas WHERE activo = 1")->fetchColumn();
            $totalPedidos = (int)$pdo->query("SELECT COUNT(*) FROM pedidos")->fetchColumn();
            $pedidosPendientes = (int)$pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente'")->fetchColumn();
            $pedidosProcesando = (int)$pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'procesando'")->fetchColumn();
            $pedidosEnviados = (int)$pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'enviado'")->fetchColumn();
            $pedidosEntregados = (int)$pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'entregado'")->fetchColumn();

            echo json_encode([
                'success' => true,
                'stats' => [
                    'productos' => $totalProductos,
                    'usuarios' => $totalUsuarios,
                    'ofertas' => $totalOfertas,
                    'pedidos' => $totalPedidos,
                    'pedidos_pendientes' => $pedidosPendientes,
                    'pedidos_procesando' => $pedidosProcesando,
                    'pedidos_enviados' => $pedidosEnviados,
                    'pedidos_entregados' => $pedidosEntregados
                ]
            ]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Error al obtener estadísticas: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
        break;
}