const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/carrito/:id_usuario
router.get('/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;

        // Buscar carrito activo del usuario
        const [carritos] = await pool.query(
            "SELECT * FROM carrito WHERE id_usuario = ? AND estado = 'activo' ORDER BY fecha_creacion DESC LIMIT 1",
            [id_usuario]
        );

        if (carritos.length === 0) {
            return res.json({ id_carrito: null, items: [], total: 0 });
        }

        const carrito = carritos[0];

        const [items] = await pool.query(`
            SELECT dc.id_detalle_carrito, dc.id_carrito, dc.id_producto, dc.cantidad, dc.precio_unitario,
                   (dc.cantidad * dc.precio_unitario) AS subtotal,
                   p.nombre_producto, p.imagen, p.precio, p.estado AS estado_producto,
                   COALESCE(i.cantidad_disponible, 0) AS stock_disponible
            FROM detalle_carrito dc
            LEFT JOIN producto p ON dc.id_producto = p.id_producto
            LEFT JOIN inventario i ON p.id_producto = i.id_producto
            WHERE dc.id_carrito = ?
        `, [carrito.id_carrito]);

        const subtotal = items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;

        // Normalizar campo nombre para compatibilidad frontend
        const itemsNorm = items.map(i => ({ ...i, nombre: i.nombre_producto, sku: `PROD-${i.id_producto}` }));

        res.json({ ...carrito, items: itemsNorm, subtotal, iva, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/carrito/agregar - Agregar producto al carrito
router.post('/agregar', async (req, res) => {
    try {
        const { id_usuario, id_producto, cantidad } = req.body;

        // Verificar stock disponible
        const [inv] = await pool.query('SELECT cantidad_disponible FROM inventario WHERE id_producto = ? LIMIT 1', [id_producto]);
        const stock = inv.length > 0 ? inv[0].cantidad_disponible : 0;
        if (stock < cantidad) {
            return res.status(400).json({ error: `Stock insuficiente. Disponible: ${stock}` });
        }

        // Obtener precio del producto
        const [prods] = await pool.query('SELECT precio FROM producto WHERE id_producto = ?', [id_producto]);
        if (prods.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        const precio_unitario = parseFloat(prods[0].precio);

        // Buscar o crear carrito activo
        let [carritos] = await pool.query(
            "SELECT * FROM carrito WHERE id_usuario = ? AND estado = 'activo' ORDER BY fecha_creacion DESC LIMIT 1",
            [id_usuario]
        );

        let id_carrito;
        if (carritos.length === 0) {
            const [res2] = await pool.query(
                "INSERT INTO carrito (id_usuario, fecha_creacion, estado) VALUES (?, NOW(), 'activo')",
                [id_usuario]
            );
            id_carrito = res2.insertId;
        } else {
            id_carrito = carritos[0].id_carrito;
        }

        // Verificar si el producto ya está en el carrito
        const [existentes] = await pool.query(
            'SELECT * FROM detalle_carrito WHERE id_carrito = ? AND id_producto = ?',
            [id_carrito, id_producto]
        );

        if (existentes.length > 0) {
            // Actualizar cantidad y subtotal
            const nuevaCantidad = existentes[0].cantidad + cantidad;
            const nuevoSubtotal = nuevaCantidad * precio_unitario;
            await pool.query(
                'UPDATE detalle_carrito SET cantidad = ?, precio_unitario = ?, subtotal = ? WHERE id_carrito = ? AND id_producto = ?',
                [nuevaCantidad, precio_unitario, nuevoSubtotal, id_carrito, id_producto]
            );
        } else {
            // Insertar nuevo item con subtotal y fecha_agregado
            const subtotal = cantidad * precio_unitario;
            await pool.query(
                'INSERT INTO detalle_carrito (id_carrito, id_producto, cantidad, precio_unitario, subtotal, fecha_agregado) VALUES (?, ?, ?, ?, ?, NOW())',
                [id_carrito, id_producto, cantidad, precio_unitario, subtotal]
            );
        }

        res.json({ mensaje: 'Producto agregado al carrito', id_carrito });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/carrito/item/:id_detalle - Actualizar cantidad de item
router.put('/item/:id_detalle', async (req, res) => {
    try {
        const { cantidad } = req.body;
        if (cantidad <= 0) {
            await pool.query('DELETE FROM detalle_carrito WHERE id_detalle_carrito = ?', [req.params.id_detalle]);
            return res.json({ mensaje: 'Item eliminado del carrito' });
        }
        await pool.query(
            'UPDATE detalle_carrito SET cantidad = ?, subtotal = (cantidad * precio_unitario) WHERE id_detalle_carrito = ?',
            [cantidad, req.params.id_detalle]
        );
        res.json({ mensaje: 'Cantidad actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/carrito/item/:id_detalle - Eliminar item del carrito
router.delete('/item/:id_detalle', async (req, res) => {
    try {
        await pool.query('DELETE FROM detalle_carrito WHERE id_detalle_carrito = ?', [req.params.id_detalle]);
        res.json({ mensaje: 'Item eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/carrito/vaciar/:id_carrito - Vaciar carrito completo
router.delete('/vaciar/:id_carrito', async (req, res) => {
    try {
        await pool.query('DELETE FROM detalle_carrito WHERE id_carrito = ?', [req.params.id_carrito]);
        await pool.query("UPDATE carrito SET estado = 'convertido' WHERE id_carrito = ?", [req.params.id_carrito]);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
