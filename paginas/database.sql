-- =======================================================
-- BASE DE DATOS: ALMACEN EL BARATÓN
-- Estructura y Datos Iniciales para MySQL 8.0
-- =======================================================

CREATE DATABASE IF NOT EXISTS `almacen_el_baraton`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `almacen_el_baraton`;

-- Desactivar temporalmente revisión de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA: rol
DROP TABLE IF EXISTS `rol`;
CREATE TABLE `rol` (
    `id_rol` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL UNIQUE,
    `descripcion` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABLA: usuario
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
    `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
    `id_rol` INT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `estado` ENUM('Activo', 'Inactivo', 'Bloqueado') DEFAULT 'Activo',
    `ultimo_acceso` DATETIME NULL,
    `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol`(`id_rol`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLA: cliente
DROP TABLE IF EXISTS `cliente`;
CREATE TABLE `cliente` (
    `id_cliente` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NULL,
    `nit` VARCHAR(50) NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `contacto` VARCHAR(150) NULL,
    `email` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(30) NULL,
    `direccion` VARCHAR(255) NULL,
    `ciudad` VARCHAR(100) NULL,
    `credito` DECIMAL(15, 2) DEFAULT 0.00,
    `estado` ENUM('activo', 'revision', 'inactivo') DEFAULT 'activo',
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cliente_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABLA: categoria
DROP TABLE IF EXISTS `categoria`;
CREATE TABLE `categoria` (
    `id_categoria` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL UNIQUE,
    `descripcion` VARCHAR(255) NULL,
    `icono` VARCHAR(100) DEFAULT 'fa-folder',
    `estado` ENUM('activo', 'inactivo') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA: proveedor
DROP TABLE IF EXISTS `proveedor`;
CREATE TABLE `proveedor` (
    `id_proveedor` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(150) NOT NULL,
    `contacto` VARCHAR(150) NULL,
    `categoria` VARCHAR(100) NULL,
    `telefono` VARCHAR(50) NULL,
    `email` VARCHAR(150) NULL,
    `direccion` VARCHAR(255) NULL,
    `calificacion` DECIMAL(2, 1) DEFAULT 5.0,
    `estado` ENUM('activo', 'inactivo') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABLA: producto
DROP TABLE IF EXISTS `producto`;
CREATE TABLE `producto` (
    `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
    `id_categoria` INT NOT NULL,
    `id_proveedor` INT NULL,
    `sku` VARCHAR(50) NOT NULL UNIQUE,
    `nombre` VARCHAR(200) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `imagen` VARCHAR(255) NULL,
    `estado` ENUM('activo', 'inactivo') DEFAULT 'activo',
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categoria`(`id_categoria`) ON UPDATE CASCADE,
    CONSTRAINT `fk_producto_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABLA: inventario
DROP TABLE IF EXISTS `inventario`;
CREATE TABLE `inventario` (
    `id_inventario` INT AUTO_INCREMENT PRIMARY KEY,
    `id_producto` INT NOT NULL UNIQUE,
    `stock_actual` INT NOT NULL DEFAULT 0,
    `stock_minimo` INT NOT NULL DEFAULT 5,
    `stock_maximo` INT NOT NULL DEFAULT 500,
    `ubicacion` VARCHAR(100) DEFAULT 'Bodega Principal',
    `ultima_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABLA: carrito
DROP TABLE IF EXISTS `carrito`;
CREATE TABLE `carrito` (
    `id_carrito` INT AUTO_INCREMENT PRIMARY KEY,
    `id_usuario` INT NULL,
    `id_cliente` INT NULL,
    `session_token` VARCHAR(100) NULL,
    `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `estado` ENUM('activo', 'abandonado', 'completado') DEFAULT 'activo',
    CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_carrito_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TABLA: detalle_carrito
DROP TABLE IF EXISTS `detalle_carrito`;
CREATE TABLE `detalle_carrito` (
    `id_detalle_carrito` INT AUTO_INCREMENT PRIMARY KEY,
    `id_carrito` INT NOT NULL,
    `id_producto` INT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_detalle_carrito_carrito` FOREIGN KEY (`id_carrito`) REFERENCES `carrito`(`id_carrito`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_detalle_carrito_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. TABLA: pedido
DROP TABLE IF EXISTS `pedido`;
CREATE TABLE `pedido` (
    `id_pedido` INT AUTO_INCREMENT PRIMARY KEY,
    `id_cliente` INT NULL,
    `id_usuario` INT NULL,
    `codigo_pedido` VARCHAR(50) NOT NULL UNIQUE,
    `fecha_pedido` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `iva` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `metodo_pago` VARCHAR(100) NOT NULL DEFAULT 'Transferencia Bancaria',
    `direccion_envio` VARCHAR(255) NULL,
    `ciudad_envio` VARCHAR(100) NULL,
    `estado` ENUM('pendiente', 'procesando', 'enviado', 'completado', 'cancelado') DEFAULT 'pendiente',
    `notas` TEXT NULL,
    CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON UPDATE CASCADE,
    CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TABLA: detalle_pedido
DROP TABLE IF EXISTS `detalle_pedido`;
CREATE TABLE `detalle_pedido` (
    `id_detalle_pedido` INT AUTO_INCREMENT PRIMARY KEY,
    `id_pedido` INT NOT NULL,
    `id_producto` INT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_detalle_pedido_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedido`(`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_detalle_pedido_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. TABLA: venta
DROP TABLE IF EXISTS `venta`;
CREATE TABLE `venta` (
    `id_venta` INT AUTO_INCREMENT PRIMARY KEY,
    `id_pedido` INT NULL UNIQUE,
    `id_cliente` INT NULL,
    `id_usuario` INT NULL,
    `numero_factura` VARCHAR(50) NOT NULL UNIQUE,
    `fecha_venta` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `iva` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `estado` ENUM('pagada', 'pendiente', 'anulada') DEFAULT 'pagada',
    CONSTRAINT `fk_venta_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedido`(`id_pedido`) ON UPDATE CASCADE,
    CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente`(`id_cliente`) ON UPDATE CASCADE,
    CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. TABLA: detalle_venta
DROP TABLE IF EXISTS `detalle_venta`;
CREATE TABLE `detalle_venta` (
    `id_detalle_venta` INT AUTO_INCREMENT PRIMARY KEY,
    `id_venta` INT NOT NULL,
    `id_producto` INT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_detalle_venta_venta` FOREIGN KEY (`id_venta`) REFERENCES `venta`(`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_detalle_venta_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. TABLA: pago
DROP TABLE IF EXISTS `pago`;
CREATE TABLE `pago` (
    `id_pago` INT AUTO_INCREMENT PRIMARY KEY,
    `id_pedido` INT NULL,
    `id_venta` INT NULL,
    `monto` DECIMAL(15, 2) NOT NULL,
    `metodo_pago` VARCHAR(100) NOT NULL,
    `referencia` VARCHAR(100) NULL,
    `comprobante_url` VARCHAR(255) NULL,
    `estado` ENUM('aprobado', 'pendiente', 'rechazado') DEFAULT 'pendiente',
    `fecha_pago` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pago_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedido`(`id_pedido`) ON UPDATE CASCADE,
    CONSTRAINT `fk_pago_venta` FOREIGN KEY (`id_venta`) REFERENCES `venta`(`id_venta`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. TABLA: compra
DROP TABLE IF EXISTS `compra`;
CREATE TABLE `compra` (
    `id_compra` INT AUTO_INCREMENT PRIMARY KEY,
    `id_proveedor` INT NOT NULL,
    `id_usuario` INT NULL,
    `numero_compra` VARCHAR(50) NOT NULL UNIQUE,
    `fecha_compra` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `estado` ENUM('recibido', 'pendiente', 'cancelado') DEFAULT 'recibido',
    CONSTRAINT `fk_compra_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor`(`id_proveedor`) ON UPDATE CASCADE,
    CONSTRAINT `fk_compra_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario`(`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. TABLA: detalle_compra
DROP TABLE IF EXISTS `detalle_compra`;
CREATE TABLE `detalle_compra` (
    `id_detalle_compra` INT AUTO_INCREMENT PRIMARY KEY,
    `id_compra` INT NOT NULL,
    `id_producto` INT NOT NULL,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_unitario` DECIMAL(15, 2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL,
    CONSTRAINT `fk_detalle_compra_compra` FOREIGN KEY (`id_compra`) REFERENCES `compra`(`id_compra`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_detalle_compra_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto`(`id_producto`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reactivar claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- DATOS INICIALES (SEED DATA)
-- =======================================================

-- 1. Roles
INSERT INTO `rol` (`id_rol`, `nombre`, `descripcion`) VALUES
(1, 'Administrador', 'Control total del sistema y reportes'),
(2, 'Vendedor', 'Gestión de cotizaciones, pedidos y clientes'),
(3, 'Supervisor', 'Auditoría, almacén e inventario'),
(4, 'Cliente', 'Usuario comprador de la tienda web');

-- 2. Usuarios
-- Contraseña por defecto para admin y usuarios de prueba: '123456' (o Admin123456)
INSERT INTO `usuario` (`id_usuario`, `id_rol`, `nombre`, `email`, `password`, `telefono`, `estado`) VALUES
(1, 1, 'Admin Principal', 'admin@industrialsupply.com', '$2a$10$e.w2i9g7q9Y0U0a6y0rMcuQ1Y81l3rM5iHkGgGzOaJmO9c7d4iVn6', '+57 300 123 4567', 'Activo'),
(2, 2, 'Sandra Milena Pérez', 'sperez@industrialsupply.com', '$2a$10$e.w2i9g7q9Y0U0a6y0rMcuQ1Y81l3rM5iHkGgGzOaJmO9c7d4iVn6', '+57 311 987 6543', 'Activo'),
(3, 3, 'Jorge Iván Ospina', 'jospina@industrialsupply.com', '$2a$10$e.w2i9g7q9Y0U0a6y0rMcuQ1Y81l3rM5iHkGgGzOaJmO9c7d4iVn6', '+57 320 456 7890', 'Activo'),
(4, 4, 'Carlos Morales', 'cmorales@andina.com.co', '$2a$10$e.w2i9g7q9Y0U0a6y0rMcuQ1Y81l3rM5iHkGgGzOaJmO9c7d4iVn6', '+57 315 111 2233', 'Activo');

-- 3. Categorías
INSERT INTO `categoria` (`id_categoria`, `nombre`, `descripcion`, `icono`, `estado`) VALUES
(1, 'Herramientas Eléctricas', 'Taladros, esmeriles, sierras industriales', 'fa-bolt', 'activo'),
(2, 'Ferretería Pesada', 'Eslingas, cadenas, discos de corte y tornillería', 'fa-tools', 'activo'),
(3, 'EPP & Seguridad', 'Cascos, gafas, guantes dieléctricos y arneses', 'fa-hard-hat', 'activo'),
(4, 'Maquinaria & Equipos', 'Generadores, compresores y motobombas', 'fa-cogs', 'activo'),
(5, 'Eléctricos e Iluminación', 'Tableros, cables industriales y reflectores LED', 'fa-plug', 'activo');

-- 4. Proveedores
INSERT INTO `proveedor` (`id_proveedor`, `nombre`, `contacto`, `categoria`, `telefono`, `email`, `calificacion`, `estado`) VALUES
(1, 'Bosch Industrial S.A.', 'Martín Serna', 'Herramientas Eléctricas', '+57 (601) 488-2900', 'ventas@bosch.com.co', 4.9, 'activo'),
(2, 'Lincoln Electric Colombia', 'Diana Suárez', 'Maquinaria & Equipos', '+57 (604) 312-7000', 'contacto@lincoln.com.co', 4.8, 'activo'),
(3, '3M Colombia S.A.', 'Jorge Mendoza', 'EPP & Seguridad', '+57 (601) 607-0707', 'industrial@3m.com.co', 5.0, 'activo'),
(4, 'Suministros del Norte', 'Andrés Vega', 'Ferretería Pesada', '+57 (605) 345-6789', 'ventas@sumnorte.com', 4.7, 'activo'),
(5, 'Caterpillar Supply', 'Roberto Gómez', 'Maquinaria & Equipos', '+57 (601) 888-9999', 'rgomez@cat.com', 4.9, 'activo');

-- 5. Clientes
INSERT INTO `cliente` (`id_cliente`, `id_usuario`, `nit`, `nombre`, `contacto`, `email`, `telefono`, `direccion`, `ciudad`, `credito`, `estado`) VALUES
(1, 4, '900.824.119-3', 'Constructora Andina S.A.', 'Ing. Carlos Morales', 'cmorales@andina.com.co', '+57 (601) 745-1234', 'Parque Industrial Módulo 4', 'Bogotá D.C.', 25000000.00, 'activo'),
(2, NULL, '860.512.443-1', 'Industrias Metalmecánicas', 'Dra. Elena Gómez', 'egomez@metalmecanicas.com', '+57 (607) 633-8822', 'Zona Industrial Santander Calle 12 #4-50', 'Bucaramanga', 15000000.00, 'activo'),
(3, NULL, '901.229.088-5', 'Logística del Norte Ltda.', 'Rodrigo Pardo', 'rpardo@logisticanorte.com', '+57 (605) 388-1122', 'Terminal de Carga Bodega 8', 'Barranquilla', 30000000.00, 'activo'),
(4, NULL, '800.198.332-9', 'Acero Corp.', 'Ing. Mateo Restrepo', 'mrestrepo@acerocorp.com.co', '+57 (604) 444-5566', 'Complejo Siderúrgico Km 8', 'Medellín', 20000000.00, 'activo');

-- 6. Productos
INSERT INTO `producto` (`id_producto`, `id_categoria`, `id_proveedor`, `sku`, `nombre`, `descripcion`, `precio`, `imagen`, `estado`) VALUES
(1, 1, 1, 'IND-8821', 'Taladro Percutor Industrial 1200W', 'Taladro de alto rendimiento para concreto y metal', 650000.00, 'taladro.jpg', 'activo'),
(2, 2, 4, 'IND-4309', 'Kit de Eslingas de Carga Pesada 5 Ton', 'Eslingas de poliéster reforzado con ganchos forjados', 210500.00, 'eslingas.jpg', 'activo'),
(3, 3, 3, 'IND-1092', 'Casco de Seguridad Dieléctrico Clase E', 'Protección dieléctrica hasta 20.000V norma ANSI', 60000.00, 'casco.jpg', 'activo'),
(4, 4, 2, 'MET-772', 'Soldadora Inverter 250A Uso Continuo', 'Tecnología IGBT para electrodo y TIG', 1597700.00, 'soldadora.jpg', 'activo'),
(5, 4, 5, 'LOG-991', 'Transpaleta Hidráulica Manual 3 Ton', 'Ruedas de poliuretano y bomba reforzada', 1750000.00, 'transpaleta.jpg', 'activo'),
(6, 2, 4, 'ACE-551', 'Disco de Corte Diamantado 9"', 'Corte rápido en concreto y piedra', 48995.00, 'disco.jpg', 'activo'),
(7, 4, 1, 'MNT-310', 'Compresor de Aire 50L 2.5HP', 'Motor libre de mantenimiento con doble salida', 950000.00, 'compresor.jpg', 'activo');

-- 7. Inventario
INSERT INTO `inventario` (`id_producto`, `stock_actual`, `stock_minimo`, `stock_maximo`, `ubicacion`) VALUES
(1, 42, 10, 100, 'Estante A-12'),
(2, 8, 10, 50, 'Estante B-04'),
(3, 120, 20, 200, 'Estante C-01'),
(4, 5, 5, 30, 'Bodega Maquinaria 1'),
(5, 0, 2, 15, 'Bodega Maquinaria 2'),
(6, 65, 15, 300, 'Estante B-10'),
(7, 14, 5, 40, 'Bodega Maquinaria 3');

-- 8. Pedidos
INSERT INTO `pedido` (`id_pedido`, `id_cliente`, `id_usuario`, `codigo_pedido`, `fecha_pedido`, `subtotal`, `iva`, `total`, `metodo_pago`, `direccion_envio`, `ciudad_envio`, `estado`, `notas`) VALUES
(1, 1, 4, '#ORD-336923', '2026-08-31 16:27:00', 10636890.76, 2021009.24, 12657900.00, 'Crédito Corporativo (30 días)', 'Parque Industrial Módulo 4', 'Bogotá D.C.', 'pendiente', 'Entregar en portería 2'),
(2, 2, NULL, '#ORD-20491', '2026-08-30 15:40:00', 3525546.22, 669853.78, 4195400.00, 'Transferencia Bancaria', 'Zona Industrial Santander Calle 12 #4-50', 'Bucaramanga', 'pendiente', 'Verificar comprobante'),
(3, 3, NULL, '#ORD-20490', '2026-08-30 11:15:00', 6840084.03, 1299615.97, 8139700.00, 'Crédito Corporativo (60 días)', 'Terminal de Carga Bodega 8', 'Barranquilla', 'procesando', 'Empaque resistente para transporte costero'),
(4, 4, NULL, '#ORD-20489', '2026-08-29 18:22:00', 1646890.76, 312909.24, 1959800.00, 'Tarjeta de Crédito Empresarial', 'Complejo Siderúrgico Km 8', 'Medellín', 'enviado', 'Guía Servientrega 99881122'),
(5, 1, 4, '#ORD-20487', '2026-08-28 20:10:00', 2949327.73, 560372.27, 3509700.00, 'Transferencia Bancaria', 'Carrera 68D # 19-40', 'Bogotá D.C.', 'pendiente', 'Revisión técnica solicitada');

-- 9. Detalle de Pedidos
INSERT INTO `detalle_pedido` (`id_pedido`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 1, 10, 650000.00, 6500000.00),
(1, 2, 15, 210526.67, 3157900.00),
(1, 3, 50, 60000.00, 3000000.00),
(2, 4, 2, 1597700.00, 3195400.00),
(2, 6, 20, 50000.00, 1000000.00),
(3, 5, 4, 1750000.00, 7000000.00),
(4, 6, 40, 48995.00, 1959800.00),
(5, 7, 3, 950000.00, 2850000.00);

-- 10. Ventas y Facturas
INSERT INTO `venta` (`id_venta`, `id_pedido`, `id_cliente`, `id_usuario`, `numero_factura`, `fecha_venta`, `subtotal`, `iva`, `total`, `estado`) VALUES
(1, 4, 4, 1, 'FAC-2026-0089', '2026-08-29 18:30:00', 1646890.76, 312909.24, 1959800.00, 'pagada');

-- 11. Detalle de Venta
INSERT INTO `detalle_venta` (`id_venta`, `id_producto`, `cantidad`, `precio_unitario`, `subtotal`) VALUES
(1, 6, 40, 48995.00, 1959800.00);

-- 12. Pagos
INSERT INTO `pago` (`id_pago`, `id_pedido`, `id_venta`, `monto`, `metodo_pago`, `referencia`, `estado`) VALUES
(1, 4, 1, 1959800.00, 'Tarjeta de Crédito Empresarial', 'TRANS-VISA-883921', 'aprobado');
