const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/pedidos
router.get('/', async (req, res) => {
    try {
        const { estado, id_cliente, id_usuario } = req.query;
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
        if (id_usuario) { query += ' AND (c.id_usuario = ? OR pe.id_cliente IN (SELECT id_cliente FROM cliente WHERE id_usuario = ?))'; params.push(id_usuario, id_usuario); }

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

        let { id_cliente, id_usuario, items, direccion_entrega, metodo_pago, observaciones, documento_identidad } = req.body;

        if (!items || items.length === 0) {
            await conn.rollback();
            return res.status(400).json({ error: 'Se requieren items para el pedido' });
        }

        const docIdentidad = documento_identidad || `CC-${Date.now().toString().slice(-8)}`;

        // Si no hay id_cliente pero sí id_usuario, buscarlo o crearlo automáticamente
        if (!id_cliente && id_usuario) {
            const [cliRows] = await conn.query('SELECT id_cliente FROM cliente WHERE id_usuario = ? LIMIT 1', [id_usuario]);
            if (cliRows.length > 0) {
                id_cliente = cliRows[0].id_cliente;
            } else {
                // Obtener datos del usuario
                const [usrRows] = await conn.query('SELECT * FROM usuario WHERE id_usuario = ? LIMIT 1', [id_usuario]);
                if (usrRows.length > 0) {
                    const u = usrRows[0];
                    const [resCli] = await conn.query(
                        `INSERT INTO cliente (id_usuario, nombre, apellido, documento_identidad, telefono, direccion, ciudad, fecha_registro, estado)
                         VALUES (?, ?, ?, ?, ?, ?, 'Bogotá', NOW(), 'activo')`,
                        [id_usuario, u.nombre || 'Cliente', u.apellido || 'General', docIdentidad, u.telefono || null, direccion_entrega || '']
                    );
                    id_cliente = resCli.insertId;
                }
            }
        }

        // Si todavía no hay id_cliente, asignar primer cliente existente o crear uno genérico
        if (!id_cliente) {
            const [cliGen] = await conn.query('SELECT id_cliente FROM cliente LIMIT 1');
            if (cliGen.length > 0) {
                id_cliente = cliGen[0].id_cliente;
            } else {
                const [resGen] = await conn.query(
                    `INSERT INTO cliente (nombre, apellido, documento_identidad, fecha_registro, estado) VALUES ('Consumidor', 'Final', ?, NOW(), 'activo')`,
                    [docIdentidad]
                );
                id_cliente = resGen.insertId;
            }
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
        let { estado_pedido, observaciones, direccion_entrega, total } = req.body;

        const params = [];
        let updates = [];

        if (estado_pedido !== undefined) {
            const e = String(estado_pedido).toLowerCase().trim();
            if (e.includes('proces') || e === 'en proceso' || e === 'procesando') {
                estado_pedido = 'en_proceso';
            } else if (e.includes('envi')) {
                estado_pedido = 'enviado';
            } else if (e.includes('entreg') || e.includes('complet')) {
                estado_pedido = 'entregado';
            } else if (e.includes('cancel')) {
                estado_pedido = 'cancelado';
            } else {
                estado_pedido = 'pendiente';
            }
            updates.push('estado_pedido = ?');
            params.push(estado_pedido);
        }

        if (observaciones !== undefined) { updates.push('observaciones = ?'); params.push(observaciones); }
        if (direccion_entrega !== undefined) { updates.push('direccion_entrega = ?'); params.push(direccion_entrega); }
        if (total !== undefined) { updates.push('total = ?'); params.push(total); }

        if (updates.length > 0) {
            params.push(req.params.id);
            await pool.query(`UPDATE pedido SET ${updates.join(', ')} WHERE id_pedido = ?`, params);
        }

        // Sincronizar estado de venta
        if (estado_pedido === 'entregado') {
            await pool.query(
                `UPDATE venta v INNER JOIN pedido pe ON v.id_venta = pe.id_venta
                 SET v.estado = 'completada' WHERE pe.id_pedido = ?`,
                [req.params.id]
            );
        } else if (estado_pedido === 'cancelado') {
            await pool.query(
                `UPDATE venta v INNER JOIN pedido pe ON v.id_venta = pe.id_venta
                 SET v.estado = 'cancelada' WHERE pe.id_pedido = ?`,
                [req.params.id]
            );
        }

        res.json({ mensaje: 'Pedido actualizado exitosamente', estado_pedido });
    } catch (error) {
        console.error('Error al actualizar pedido:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/pedidos/:id - Eliminar pedido
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Obtener datos del pedido (para saber id_venta)
        const [pedRows] = await conn.query('SELECT id_venta FROM pedido WHERE id_pedido = ?', [req.params.id]);
        if (pedRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        const id_venta = pedRows[0].id_venta;

        // 2. Eliminar detalles del pedido
        await conn.query('DELETE FROM detalle_pedido WHERE id_pedido = ?', [req.params.id]);

        // 3. Eliminar el pedido
        await conn.query('DELETE FROM pedido WHERE id_pedido = ?', [req.params.id]);

        // 4. Si tiene venta asociada, limpiar pagos y detalles de venta
        if (id_venta) {
            await conn.query('DELETE FROM pago WHERE id_venta = ?', [id_venta]);
            await conn.query('DELETE FROM detalle_venta WHERE id_venta = ?', [id_venta]);
            await conn.query('DELETE FROM venta WHERE id_venta = ?', [id_venta]);
        }

        await conn.commit();
        res.json({ mensaje: 'Pedido eliminado exitosamente' });
    } catch (error) {
        await conn.rollback();
        console.error('Error al eliminar pedido:', error);
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
