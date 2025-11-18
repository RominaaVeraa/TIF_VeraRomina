<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host     = '127.0.0.1';
$dbname   = 'digital_point';
$username = 'root';
$password = '';
$port     = 3308; 

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    error_log('Error de BD: ' . $e->getMessage());
    die('Error de conexión a la base de datos');
}

function isAdmin() {
    return isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin';
}

function getCurrentUser() {
    if (isset($_SESSION['user_id'])) {
        global $pdo;
        try {
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            return $stmt->fetch();
        } catch(PDOException $e) {
            error_log('Error al obtener usuario: ' . $e->getMessage());
            return null;
        }
    }
    return null;
}
