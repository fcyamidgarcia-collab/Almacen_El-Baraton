const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reportes/dashboard - KPIs principales
router.get('/dashboard', async (req, res) => {
    try {
        // Total ventas del mes actual
        const [ventasMes] = await pool.query(`
            SELECT COALESCE(SUM(total), 0) AS total_ventas, COUNT(*) AS num_ventas
            FROM venta
            WHERE MONTH(fecha_venta) = MONTH(NOW()) AND YEAR(fecha_venta) = YEAR(NOW())
        `);

        // Total clientes activos
        const [totalClientes] = await pool.query("SELECT COUNT(*) AS total FROM cliente WHERE estado = 'activo'");

        // Total productos activos
        const [totalProductos] = await pool.query("SELECT COUNT(*) AS total FROM producto WHERE estado = 'activo'");

        // Pedidos pendientes
        const [pedidosPendientes] = await pool.query("SELECT COUNT(*) AS total FROM pedido WHERE estado_pedido = 'pendiente'");

        // Productos con stock bajo
        const [stockBajo] = await pool.query(`
            SELECT p.nombre_producto, i.cantidad_disponible, i.cantidad_minima
            FROM inventario i
            LEFT JOIN producto p ON i.id_producto = p.id_producto
            WHERE i.cantidad_disponible <= i.cantidad_minima AND p.estado = 'activo'
            ORDER BY i.cantidad_disponible ASC LIMIT 10
        `);

        // Últimas ventas
        const [ultimasVentas] = await pool.query(`
            SELECT v.id_venta, v.fecha_venta, v.total, v.estado,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            ORDER BY v.fecha_venta DESC LIMIT 5
        `);

        // Top productos más vendidos
        const [topProductos] = await pool.query(`
            SELECT p.nombre_producto, SUM(dv.cantidad) AS total_vendido, SUM(dv.subtotal) AS ingresos
            FROM detalle_venta dv
            LEFT JOIN producto p ON dv.id_producto = p.id_producto
            GROUP BY dv.id_producto, p.nombre_producto
            ORDER BY total_vendido DESC LIMIT 5
        `);

        // Ventas por mes (últimos 6 meses)
        const [ventasPorMes] = await pool.query(`
            SELECT DATE_FORMAT(fecha_venta, '%Y-%m') AS mes,
                   SUM(total) AS total_ventas,
                   COUNT(*) AS num_ventas
            FROM venta
            WHERE fecha_venta >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(fecha_venta, '%Y-%m')
            ORDER BY mes ASC
        `);

        // Total compras del mes
        const [comprasMes] = await pool.query(`
            SELECT COALESCE(SUM(total), 0) AS total_compras FROM compra
            WHERE MONTH(fecha_compra) = MONTH(NOW()) AND YEAR(fecha_compra) = YEAR(NOW())
        `);

        res.json({
            ventas_mes: ventasMes[0],
            total_clientes: totalClientes[0].total,
            total_productos: totalProductos[0].total,
            pedidos_pendientes: pedidosPendientes[0].total,
            stock_bajo: stockBajo,
            ultimas_ventas: ultimasVentas,
            top_productos: topProductos,
            ventas_por_mes: ventasPorMes,
            compras_mes: comprasMes[0]
        });
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reportes/inventario
router.get('/inventario', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.id_inventario, i.id_producto, i.cantidad_disponible, i.cantidad_minima,
                   i.cantidad_maxima, i.ubicacion, i.fecha_actualizacion,
                   p.nombre_producto, p.precio, c.nombre_categoria,
                   CASE
                       WHEN i.cantidad_disponible = 0 THEN 'sin_stock'
                       WHEN i.cantidad_disponible <= i.cantidad_minima THEN 'stock_bajo'
                       ELSE 'normal'
                   END AS estado_stock
            FROM inventario i
            LEFT JOIN producto p ON i.id_producto = p.id_producto
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            WHERE p.estado = 'activo'
            ORDER BY estado_stock ASC, i.cantidad_disponible ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reportes/ventas
router.get('/ventas', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        let query = `
            SELECT v.id_venta, v.fecha_venta, v.total, v.estado, v.id_cliente, v.id_usuario,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   u.nombre AS nombre_usuario
            FROM venta v
            LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON v.id_usuario = u.id_usuario
            WHERE 1=1
        `;
        const params = [];
        if (desde) { query += ' AND DATE(v.fecha_venta) >= ?'; params.push(desde); }
        if (hasta) { query += ' AND DATE(v.fecha_venta) <= ?'; params.push(hasta); }
        query += ' ORDER BY v.fecha_venta DESC';

        const [ventas] = await pool.query(query, params);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
