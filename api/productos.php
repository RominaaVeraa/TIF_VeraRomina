<?php
require_once '../includes/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? 'getAll';

if ($action === 'getAll') {
    try {
        $stmt = $pdo->query("
            SELECT 
                p.id, p.titulo, p.marca, p.modelo, p.precio, 
                p.tipo, p.descripcion, p.rating, p.reviews, p.stock,
                c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            ORDER BY p.fecha_creacion DESC
        ");
        
        $productos = $stmt->fetchAll();
        $productosCompletos = [];
        
        foreach ($productos as $producto) {
            $id = $producto['id'];
            
            $stmtImg = $pdo->prepare("SELECT url_imagen FROM imagenes_productos WHERE producto_id = ? ORDER BY orden");
            $stmtImg->execute([$id]);
            $imagenes = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
            
            $stmtBadges = $pdo->prepare("SELECT badge FROM badges WHERE producto_id = ?");
            $stmtBadges->execute([$id]);
            $badges = $stmtBadges->fetchAll(PDO::FETCH_COLUMN);
            
            $stmtSpecs = $pdo->prepare("SELECT clave, valor FROM especificaciones_productos WHERE producto_id = ?");
            $stmtSpecs->execute([$id]);
            $specs = [];
            while ($spec = $stmtSpecs->fetch()) {
                $specs[$spec['clave']] = $spec['valor'];
            }
            
            $productosCompletos[] = [
                'id' => $id,
                'title' => $producto['titulo'],
                'brand' => $producto['marca'],
                'model' => $producto['modelo'],
                'price' => floatval($producto['precio']),
                'category' => $producto['categoria_nombre'],
                'type' => $producto['tipo'],
                'description' => $producto['descripcion'],
                'rating' => floatval($producto['rating']),
                'reviews' => intval($producto['reviews']),
                'stock' => intval($producto['stock']),
                'images' => $imagenes,
                'badges' => $badges,
                'specifications' => $specs
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $productosCompletos
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener productos: ' . $e->getMessage()
        ]);
    }
    exit;
}

if ($action === 'getById') {
    $id = $_GET['id'] ?? '';
    
    if (empty($id)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ID requerido'
        ]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.id, p.titulo, p.marca, p.modelo, p.precio, 
                p.tipo, p.descripcion, p.rating, p.reviews, p.stock,
                c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ? AND p.activo = 1
        ");
        $stmt->execute([$id]);
        $producto = $stmt->fetch();
        
        if (!$producto) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Producto no encontrado'
            ]);
            exit;
        }
        
        $stmtImg = $pdo->prepare("SELECT url_imagen FROM imagenes_productos WHERE producto_id = ? ORDER BY orden");
        $stmtImg->execute([$id]);
        $imagenes = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
        
        $stmtBadges = $pdo->prepare("SELECT badge FROM badges WHERE producto_id = ?");
        $stmtBadges->execute([$id]);
        $badges = $stmtBadges->fetchAll(PDO::FETCH_COLUMN);
        
        $stmtSpecs = $pdo->prepare("SELECT clave, valor FROM especificaciones_productos WHERE producto_id = ?");
        $stmtSpecs->execute([$id]);
        $specs = [];
        while ($spec = $stmtSpecs->fetch()) {
            $specs[$spec['clave']] = $spec['valor'];
        }
        
        $productoCompleto = [
            'id' => $id,
            'title' => $producto['titulo'],
            'brand' => $producto['marca'],
            'model' => $producto['modelo'],
            'price' => floatval($producto['precio']),
            'category' => $producto['categoria_nombre'],
            'type' => $producto['tipo'],
            'description' => $producto['descripcion'],
            'rating' => floatval($producto['rating']),
            'reviews' => intval($producto['reviews']),
            'stock' => intval($producto['stock']),
            'images' => $imagenes,
            'badges' => $badges,
            'specifications' => $specs
        ];
        
        echo json_encode([
            'success' => true,
            'data' => $productoCompleto
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    exit;
}

if ($action === 'getByType') {
    $tipo = $_GET['tipo'] ?? '';
    
    if (empty($tipo)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tipo requerido'
        ]);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.id, p.titulo, p.marca, p.modelo, p.precio, 
                p.tipo, p.descripcion, p.rating, p.reviews, p.stock,
                c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.tipo = ? AND p.activo = 1
            ORDER BY p.fecha_creacion DESC
        ");
        $stmt->execute([$tipo]);
        
        $productos = $stmt->fetchAll();
        $productosCompletos = [];
        
        foreach ($productos as $producto) {
            $id = $producto['id'];
            
            $stmtImg = $pdo->prepare("SELECT url_imagen FROM imagenes_productos WHERE producto_id = ? ORDER BY orden");
            $stmtImg->execute([$id]);
            $imagenes = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
            
            $stmtBadges = $pdo->prepare("SELECT badge FROM badges WHERE producto_id = ?");
            $stmtBadges->execute([$id]);
            $badges = $stmtBadges->fetchAll(PDO::FETCH_COLUMN);
            
            $stmtSpecs = $pdo->prepare("SELECT clave, valor FROM especificaciones_productos WHERE producto_id = ?");
            $stmtSpecs->execute([$id]);
            $specs = [];
            while ($spec = $stmtSpecs->fetch()) {
                $specs[$spec['clave']] = $spec['valor'];
            }
            
            $productosCompletos[] = [
                'id' => $id,
                'title' => $producto['titulo'],
                'brand' => $producto['marca'],
                'model' => $producto['modelo'],
                'price' => floatval($producto['precio']),
                'category' => $producto['categoria_nombre'],
                'type' => $producto['tipo'],
                'description' => $producto['descripcion'],
                'rating' => floatval($producto['rating']),
                'reviews' => intval($producto['reviews']),
                'stock' => intval($producto['stock']),
                'images' => $imagenes,
                'badges' => $badges,
                'specifications' => $specs
            ];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $productosCompletos
        ], JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(400);
echo json_encode([
    'success' => false,
    'message' => 'Acción no válida'
]);
