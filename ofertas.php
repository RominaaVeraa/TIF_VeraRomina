<?php
require_once 'includes/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $stmt = $pdo->query("
        SELECT 
            o.id as oferta_id,
            o.producto_id,
            o.descuento_porcentaje,
            o.precio_oferta,
            o.fecha_inicio,
            o.fecha_fin,
            p.titulo,
            p.marca,
            p.modelo,
            p.precio,
            p.tipo,
            p.rating,
            p.reviews,
            c.nombre as categoria,
            GROUP_CONCAT(DISTINCT i.url_imagen ORDER BY i.orden SEPARATOR ',') as imagenes
        FROM ofertas o
        JOIN productos p ON o.producto_id = p.id
        LEFT JOIN categorias c ON p.categoria_id = c.id
        LEFT JOIN imagenes_productos i ON p.id = i.producto_id
        WHERE o.activo = 1 AND p.activo = 1
        GROUP BY o.id, p.id
        ORDER BY o.id DESC
    ");
    
    $ofertas = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log("Error al cargar ofertas: " . $e->getMessage());
    $ofertas = [];
}

function getSpecs($oferta) {
    $specs = '';
    
    if ($oferta['tipo'] === 'notebook') {
        $specs = 'Intel i7 • 16GB RAM • SSD 512GB';
    } else if ($oferta['tipo'] === 'monitor') {
        $specs = 'QHD • 144Hz • IPS';
    }
    
    return $specs;
}

function getFilterCategories($oferta) {
    $categories = [$oferta['tipo'] . 's'];
    
    if ($oferta['categoria']) {
        $catLower = strtolower($oferta['categoria']);
        if (strpos($catLower, 'gaming') !== false) {
            $categories[] = 'gaming';
        }
        if (strpos($catLower, 'oficina') !== false || strpos($catLower, 'profesional') !== false) {
            $categories[] = 'office';
        }
    }
    
    return implode(' ', $categories);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ofertas Especiales - Digital Point</title>
    <link rel="stylesheet" href="css/global.css">
    <link rel="stylesheet" href="css/pages/ofertas.css">
    <link rel="stylesheet" href="css/admin_controls.css">
</head>
<body 
    data-page="ofertas"
    data-user-role="<?php echo isset($_SESSION['usuario']) ? htmlspecialchars($_SESSION['usuario']['rol']) : 'guest'; ?>"
>

    <?php include 'includes/header.php'; ?>

    <section class="offers-hero">
        <div class="hero-background-slider">
            <div class="background-slide active"></div>
            <div class="background-slide"></div>
        </div>
        
        <div class="hero-content">
            <div class="offer-badge">
                <span class="offer-text">OFERTAS ESPECIALES</span>
                <div class="badge-glow"></div>
            </div>
            <h1 class="hero-title">
                <span class="title-line">HASTA</span>
                <span class="title-line gradient-text">40% OFF</span>
                <span class="title-line">EN PRODUCTOS SELECCIONADOS</span>
            </h1>
            <p class="hero-subtitle">Aprovechá estos precios únicos por tiempo limitado</p>
            <div class="countdown-timer">
                <div class="timer-item">
                    <span class="timer-number" id="days">03</span>
                    <span class="timer-label">DÍAS</span>
                </div>
                <div class="timer-item">
                    <span class="timer-number" id="hours">12</span>
                    <span class="timer-label">HORAS</span>
                </div>
                <div class="timer-item">
                    <span class="timer-number" id="minutes">45</span>
                    <span class="timer-label">MINUTOS</span>
                </div>
                <div class="timer-item">
                    <span class="timer-number" id="seconds">23</span>
                    <span class="timer-label">SEGUNDOS</span>
                </div>
            </div>
        </div>
        <div class="hero-overlay"></div>
        <div class="floating-elements">
            <div class="floating-element" style="top: 20%; left: 10%; animation-delay: 0s;"></div>
            <div class="floating-element" style="top: 60%; right: 15%; animation-delay: 2s;"></div>
            <div class="floating-element" style="bottom: 30%; left: 20%; animation-delay: 4s;"></div>
        </div>
    </section>

    <section class="filters-section">
        <div class="container">
            <div class="filters-header">
                <h2>Filtrar Ofertas</h2>
                <span class="offers-count" id="offers-count"><?php echo count($ofertas); ?> ofertas disponibles</span>
            </div>
            <div class="filter-tabs">
                <button class="filter-tab active" data-category="all">Todas las Ofertas</button>
                <button class="filter-tab" data-category="notebooks">Notebooks</button>
                <button class="filter-tab" data-category="monitors">Monitores</button>
                <button class="filter-tab" data-category="gaming">Gaming</button>
                <button class="filter-tab" data-category="office">Oficina</button>
            </div>
        </div>
    </section>

    <section class="main-offers">
        <div class="container">
            <?php if (empty($ofertas)): ?>
                <div style="text-align: center; padding: 60px 20px;">
                    <h3 style="color: #e8c5d8; font-size: 1.8rem; margin-bottom: 20px;">No hay ofertas disponibles en este momento</h3>
                    <p style="color: rgba(204, 204, 204, 0.8); font-size: 1.1rem;">Volvé pronto para descubrir nuevas promociones</p>
                </div>
            <?php else: ?>
                <div class="offers-grid" id="offers-grid">
                    <?php foreach ($ofertas as $index => $oferta): 
                        $imagenes = !empty($oferta['imagenes']) ? explode(',', $oferta['imagenes']) : [];
                        $imagenPrincipal = !empty($imagenes) ? $imagenes[0] : 'images/placeholder.png';
                        $precioOriginal = number_format($oferta['precio'], 0, ',', '.');
                        $precioOferta = number_format($oferta['precio_oferta'], 0, ',', '.');
                        $descuento = round($oferta['descuento_porcentaje']);
                        $stars = round($oferta['rating']);
                        $filterCategories = getFilterCategories($oferta);
                        $specs = getSpecs($oferta);
                    ?>
                    
                    <div class="offer-card" 
                         data-category="<?php echo htmlspecialchars($filterCategories); ?>" 
                         data-product-id="<?php echo htmlspecialchars($oferta['producto_id']); ?>"
                         style="animation-delay: <?php echo ($index * 0.1); ?>s;">
                        
                        <div class="offer-badge-card <?php echo (strpos($filterCategories, 'gaming') !== false) ? 'gaming' : ''; ?>">
                            <span class="discount-percent"><?php echo $descuento; ?>% OFF</span>
                        </div>
                        
                        <div class="offer-image">
                            <img src="<?php echo htmlspecialchars($imagenPrincipal); ?>" 
                                 alt="<?php echo htmlspecialchars($oferta['titulo']); ?>"
                                 onerror="this.src='images/placeholder.png'">
                            <div class="offer-overlay">
                                <button class="quick-view-btn" onclick="window.location.href='ficha_producto.php?id=<?php echo htmlspecialchars($oferta['producto_id']); ?>'">Ver Detalles</button>
                            </div>
                        </div>
                        
                        <div class="offer-info">
                            <h3 class="offer-title"><?php echo htmlspecialchars($oferta['titulo']); ?></h3>
                            <div class="offer-specs">
                                <span><?php echo htmlspecialchars($specs); ?></span>
                            </div>
                            <div class="offer-rating">
                                <div class="stars">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                        <span class="star <?php echo ($i <= $stars) ? 'filled' : ''; ?>">★</span>
                                    <?php endfor; ?>
                                </div>
                                <span class="rating-count">(<?php echo $oferta['reviews']; ?> reseñas)</span>
                            </div>
                            <div class="offer-prices">
                                <span class="original-price">$<?php echo $precioOriginal; ?></span>
                                <span class="offer-price">$<?php echo $precioOferta; ?></span>
                            </div>
                            <div class="offer-actions">
                                <button class="add-to-cart-offer" onclick="addToCartOffer('<?php echo htmlspecialchars($oferta['producto_id']); ?>')">
                                    <img src="images/icons/carrito-de-compras.png" alt="Carrito">
                                    Agregar al Carrito
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </section>

    <?php include 'includes/footer.php'; ?>

    <script>
        window.offersData = <?php echo json_encode(array_map(function($o) {
            $imagenes = !empty($o['imagenes']) ? explode(',', $o['imagenes']) : [];
            return [
                'id' => $o['producto_id'],
                'name' => $o['titulo'],
                'brand' => $o['marca'],
                'model' => $o['modelo'],
                'price' => $o['precio'],
                'offerPrice' => $o['precio_oferta'],
                'discount' => $o['descuento_porcentaje'],
                'type' => $o['tipo'],
                'category' => $o['categoria'],
                'image' => !empty($imagenes) ? $imagenes[0] : 'images/placeholder.png'
            ];
        }, $ofertas)); ?>;

        window.addEventListener('load', () => {
            window.dispatchEvent(new Event('products:loaded'));
        });
    </script>
    
    <script src="js/pages/common_cart.js"></script>
    <script src="js/global.js"></script>
    <script src="js/components.js"></script>
    <script src="js/pages/ofertas.js"></script>
    <script src="js/admin_controls.js"></script>
</body>
</html>