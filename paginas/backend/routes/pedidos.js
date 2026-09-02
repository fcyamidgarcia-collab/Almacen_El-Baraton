const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/pedidos
router.get('/', async (req, res) => {
    try {
        const { estado, id_cliente } = req.query;
        let query = `
            SELECT pe.id_pedido, pe.id_cliente, pe.id_venta, pe.fecha_pedido,
                   pe.direccion_entrega, pe.estado_pedido, pe.total, pe.observaciones,
                   c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
                   u.correo AS correo_cliente
            FROM pedido pe
            LEFT JOIN cliente c ON pe.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE 1=1
        `;
        const params = [];

        if (estado) { query += ' AND pe.estado_pedido = ?'; params.push(estado); }
        if (id_cliente) { query += ' AND pe.id_cliente = ?'; params.push(id_cliente); }

        query += ' ORDER BY pe.fecha_pedido DESC';
        const [pedidos] = await pool.query(query, params);

        // Adjuntar detalles de cada pedido
        for (let pedido of pedidos) {
            const [detalles] = await pool.query(`
                SELECT dp.id_detalle_pedido, dp.id_producto, dp.cantidad, dp.precio_unitario, dp.subtotal,
                       p.nombre_producto, p.imagen
                FROM detalle_pedido dp
                LEFT JOIN producto p ON dp.id_producto = p.id_producto
                WHERE dp.id_pedido = ?
            `, [pedido.id_pedido]);
            pedido.items = detalles;
        }

        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pedidos/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT pe.*, c.nombre AS nombre_cliente, c.apellido AS apellido_cliente, c.telefono,
                   c.documento_identidad, u.correo AS correo_cliente
            FROM pedido pe
            LEFT JOIN cliente c ON pe.id_cliente = c.id_cliente
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE pe.id_pedido = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

        const [detalles] = await pool.query(`
            SELECT dp.*, p.nombre_producto, p.imagen, p.precio
            FROM detalle_pedido dp
            LEFT JOIN producto p ON dp.id_producto = p.id_producto
            WHERE dp.id_pedido = ?
        `, [req.params.id]);

        rows[0].items = detalles;
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pedidos - Crear pedido transaccional completo
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { id_cliente, id_usuario, items, direccion_entrega, metodo_pago, observaciones } = req.body;

        if (!id_cliente || !items || items.length === 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'Se requiere id_cliente e items del pedido' });
        }

        // Calcular total
        let total = 0;
        for (const item of items) {
            total += parseFloat(item.precio_unitario) * parseInt(item.cantidad);
        }

        // 1. Crear venta
        const [resVenta] = await conn.query(
            `INSERT INTO venta (id_cliente, id_usuario, fecha_venta, total, estado) VALUES (?, ?, NOW(), ?, 'pendiente')`,
            [id_cliente, id_usuario || 1, total]
        );
        const id_venta = resVenta.insertId;

        // 2. Crear pedido
        const [resPedido] = await conn.query(
            `INSERT INTO pedido (id_cliente, id_venta, fecha_pedido, direccion_entrega, estado_pedido, total, observaciones)
             VALUES (?, ?, NOW(), ?, 'pendiente', ?, ?)`,
            [id_cliente, id_venta, direccion_entrega || '', total, observaciones || '']
        );
        const id_pedido = resPedido.insertId;

        // 3. Insertar detalles del pedido y actualizar inventario
        for (const item of items) {
            const subtotal = parseFloat(item.precio_unitario) * parseInt(item.cantidad);
            await conn.query(
                `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_pedido, item.id_producto, item.cantidad, item.precio_unitario, subtotal]
            );

            // También insertar en detalle_venta
            await conn.query(
                `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_venta, item.id_producto, item.cantidad, item.precio_unitario, subtotal]
            );

            // Descontar inventario
            await conn.query(
                `UPDATE inventario SET cantidad_disponible = GREATEST(0, cantidad_disponible - ?), fecha_actualizacion = NOW()
                 WHERE id_producto = ?`,
                [item.cantidad, item.id_producto]
            );
        }

        // 4. Registrar pago
        await conn.query(
            `INSERT INTO pago (fecha_pago, monto, metodo_pago, estado, id_venta) VALUES (NOW(), ?, ?, 'en revision', ?)`,
            [total, metodo_pago || 'efectivo', id_venta]
        );

        await conn.commit();

        res.status(201).json({
            mensaje: 'Pedido creado exitosamente',
            id_pedido,
            id_venta,
            total
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error al crear pedido:', error);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

// PUT /api/pedidos/:id - Actualizar estado del pedido
router.put('/:id', async (req, res) => {
    try {
        const { estado_pedido, observaciones } = req.body;
        await pool.query(
            'UPDATE pedido SET estado_pedido=?, observaciones=? WHERE id_pedido=?',
            [estado_pedido, observaciones || null, req.params.id]
        );

        // Sincronizar estado de venta si cambia a completada
        if (estado_pedido === 'entregado') {
            await pool.query(
                `UPDATE venta v INNER JOIN pedido pe ON v.id_venta = pe.id_venta
                 SET v.estado = 'completada' WHERE pe.id_pedido = ?`,
                [req.params.id]
            );
        }

        res.json({ mensaje: 'Estado del pedido actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
