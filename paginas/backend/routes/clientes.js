const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/clientes
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id_cliente, c.id_usuario, c.nombre, c.apellido, c.documento_identidad,
                   c.telefono, c.direccion, c.ciudad, c.fecha_registro, c.estado,
                   u.correo,
                   COUNT(DISTINCT p.id_pedido) AS total_pedidos
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            LEFT JOIN pedido p ON c.id_cliente = p.id_cliente
            GROUP BY c.id_cliente
            ORDER BY c.fecha_registro DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, u.correo
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_cliente = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/usuario/:id_usuario - Obtener cliente por id_usuario
router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, u.correo
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_usuario = ? LIMIT 1
        `, [req.params.id_usuario]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/:id/pedidos - Historial de pedidos del cliente
router.get('/:id/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT pe.id_pedido, pe.fecha_pedido, pe.direccion_entrega, pe.estado_pedido, pe.total, pe.observaciones,
                   v.id_venta, v.fecha_venta, v.estado AS estado_venta
            FROM pedido pe
            LEFT JOIN venta v ON pe.id_venta = v.id_venta
            WHERE pe.id_cliente = ?
            ORDER BY pe.fecha_pedido DESC
        `, [req.params.id]);

        for (let p of pedidos) {
            const [detalles] = await pool.query(`
                SELECT dp.*, pr.nombre_producto, pr.imagen, pr.precio
                FROM detalle_pedido dp
                LEFT JOIN producto pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = ?
            `, [p.id_pedido]);
            p.items = detalles;
        }

        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre, apellido, documento_identidad, telefono, direccion, ciudad, estado } = req.body;
        await pool.query(
            `UPDATE cliente SET nombre=?, apellido=?, documento_identidad=?, telefono=?, direccion=?, ciudad=?, estado=?
             WHERE id_cliente=?`,
            [nombre, apellido, documento_identidad || null, telefono || null, direccion || null, ciudad || null, estado || 'activo', req.params.id]
        );
        res.json({ mensaje: 'Cliente actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/clientes/:id (desactivar)
router.delete('/:id', async (req, res) => {
    try {
        await pool.query("UPDATE cliente SET estado='inactivo' WHERE id_cliente=?", [req.params.id]);
        res.json({ mensaje: 'Cliente desactivado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
