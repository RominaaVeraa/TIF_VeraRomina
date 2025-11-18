<?php

header('Content-Type: application/javascript; charset=utf-8');

$host     = '127.0.0.1';
$port     = 3308;
$dbname   = 'digital_point';
$username = 'root';
$password = '';
$charset  = 'utf8mb4';

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=$charset";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo "const PRODUCTOS_DB = { notebooks: {}, monitors: {} };\n";
    echo "console.error('Error al conectar a la BD: " . addslashes($e->getMessage()) . "');\n";
    exit;
}

try {
    $sqlProductos = "
        SELECT 
            p.id,
            p.titulo,
            p.descripcion,
            p.precio,
            p.tipo,
            p.rating,
            p.reviews,
            c.nombre AS categoria
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id = c.id
        WHERE p.activo = 1
        ORDER BY p.id
    ";
    $stmtProd  = $pdo->query($sqlProductos);
    $productos = $stmtProd->fetchAll();
} catch (PDOException $e) {
    echo "const PRODUCTOS_DB = { notebooks: {}, monitors: {} };\n";
    echo "console.error('Error al consultar productos: " . addslashes($e->getMessage()) . "');\n";
    exit;
}

$imagenesPorProducto = [];
try {
    $sqlImg = "
        SELECT 
            producto_id,
            url_imagen,
            orden,
            es_principal
        FROM imagenes_productos
        ORDER BY producto_id, es_principal DESC, orden, id
    ";
    $stmtImg = $pdo->query($sqlImg);
    while ($row = $stmtImg->fetch()) {
        $pid = $row['producto_id'];
        if (!isset($imagenesPorProducto[$pid])) {
            $imagenesPorProducto[$pid] = [];
        }
        $imagenesPorProducto[$pid][] = $row['url_imagen'];
    }
} catch (PDOException $e) {
    $imagenesPorProducto = [];
}

$specsPorProducto = [];
try {
    $sqlSpecs = "
        SELECT 
            producto_id,
            clave,
            valor
        FROM especificaciones_productos
        ORDER BY producto_id, id
    ";
    $stmtSpecs = $pdo->query($sqlSpecs);
    while ($row = $stmtSpecs->fetch()) {
        $pid = $row['producto_id'];
        if (!isset($specsPorProducto[$pid])) {
            $specsPorProducto[$pid] = [];
        }
        $specsPorProducto[$pid][$row['clave']] = $row['valor'];
    }
} catch (PDOException $e) {
    $specsPorProducto = [];
}

$badgesPorProducto = [];
try {
    $sqlBadges = "
        SELECT 
            producto_id,
            badge
        FROM badges
        ORDER BY producto_id, id
    ";
    $stmtBadges = $pdo->query($sqlBadges);
    while ($row = $stmtBadges->fetch()) {
        $pid = $row['producto_id'];
        if (!isset($badgesPorProducto[$pid])) {
            $badgesPorProducto[$pid] = [];
        }
        $badgesPorProducto[$pid][] = $row['badge'];
    }
} catch (PDOException $e) {
    $badgesPorProducto = [];
}

$notebooks = [];
$monitors  = [];

foreach ($productos as $p) {
    $id   = $p['id'];                
    $tipo = strtolower($p['tipo']);  

    $productoJS = [
        'id'            => $id,
        'title'         => $p['titulo'],
        'description'   => $p['descripcion'],
        'price'         => (float)$p['precio'],
        'category'      => $p['categoria'] ?? '',
        'type'          => $tipo,
        'rating'        => $p['rating'] !== null ? (float)$p['rating'] : 0.0,
        'reviews'       => $p['reviews'] !== null ? (int)$p['reviews'] : 0,
        'badges'        => $badgesPorProducto[$id] ?? [],
        'images'        => $imagenesPorProducto[$id] ?? [],
        'specifications'=> $specsPorProducto[$id] ?? [],
    ];

    if ($tipo === 'notebook') {
        $notebooks[$id] = $productoJS;
    } elseif ($tipo === 'monitor') {
        $monitors[$id] = $productoJS;
    }
}

$estructura = [
    'notebooks' => $notebooks,
    'monitors'  => $monitors,
];

echo "const PRODUCTOS_DB = " . json_encode(
    $estructura,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
) . ";\n";
