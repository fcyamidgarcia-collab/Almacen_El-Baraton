const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/productos - Listar todos los productos con categoría e inventario
router.get('/', async (req, res) => {
    try {
        const { categoria, buscar, estado } = req.query;
        let query = `
            SELECT p.id_producto, p.nombre_producto, p.descripcion, p.precio, p.imagen, p.imagenes_secundarias, p.estado,
                   p.id_categoria, p.id_proveedor,
                   c.nombre_categoria,
                   pr.nombre_proveedor,
                   COALESCE(i.cantidad_disponible, 0) AS stock
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
            LEFT JOIN inventario i ON p.id_producto = i.id_producto
            WHERE 1=1
        `;
        const params = [];

        if (estado) {
            query += ' AND p.estado = ?';
            params.push(estado);
        } else {
            query += " AND p.estado = 'activo'";
        }

        if (categoria) {
            query += ' AND p.id_categoria = ?';
            params.push(categoria);
        }

        if (buscar) {
            query += ' AND (p.nombre_producto LIKE ? OR p.descripcion LIKE ?)';
            params.push(`%${buscar}%`, `%${buscar}%`);
        }

        query += ' ORDER BY p.id_producto ASC';

        const [productos] = await pool.query(query, params);
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, c.nombre_categoria, COALESCE(i.cantidad_disponible, 0) AS stock,
                   pr.nombre_proveedor
            FROM producto p
            LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
            LEFT JOIN inventario i ON p.id_producto = i.id_producto
            LEFT JOIN proveedor pr ON p.id_proveedor = pr.id_proveedor
            WHERE p.id_producto = ?
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/productos
router.post('/', async (req, res) => {
    try {
        const { nombre_producto, descripcion, precio, imagen, imagenes_secundarias, estado, id_categoria, id_proveedor, stock_inicial } = req.body;
        
        let secStr = null;
        if (Array.isArray(imagenes_secundarias)) {
            secStr = JSON.stringify(imagenes_secundarias.filter(url => Boolean(url && url.trim())));
        } else if (typeof imagenes_secundarias === 'string' && imagenes_secundarias.trim()) {
            secStr = imagenes_secundarias.trim();
        }

        const [result] = await pool.query(
            `INSERT INTO producto (id_categoria, id_proveedor, nombre_producto, descripcion, precio, imagen, imagenes_secundarias, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_categoria, id_proveedor || null, nombre_producto, descripcion || null, precio, imagen || null, secStr, estado || 'activo']
        );
        const id_producto = result.insertId;

        // Crear registro de inventario
        await pool.query(
            `INSERT INTO inventario (id_producto, cantidad_disponible, cantidad_minima, cantidad_maxima, ubicacion, fecha_actualizacion, id_usuario)
             VALUES (?, ?, 5, 1000, 'bodega a', NOW(), 1)`,
            [id_producto, stock_inicial || 0]
        );

        res.status(201).json({ mensaje: 'Producto creado exitosamente', id_producto });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre_producto, descripcion, precio, imagen, imagenes_secundarias, estado, id_categoria, id_proveedor, stock } = req.body;

        let secStr = null;
        if (Array.isArray(imagenes_secundarias)) {
            secStr = JSON.stringify(imagenes_secundarias.filter(url => Boolean(url && url.trim())));
        } else if (typeof imagenes_secundarias === 'string' && imagenes_secundarias.trim()) {
            secStr = imagenes_secundarias.trim();
        }

        await pool.query(
            `UPDATE producto SET id_categoria=?, id_proveedor=?, nombre_producto=?, descripcion=?, precio=?, imagen=?, imagenes_secundarias=?, estado=?
             WHERE id_producto=?`,
            [id_categoria, id_proveedor || null, nombre_producto, descripcion || null, precio, imagen || null, secStr, estado || 'activo', req.params.id]
        );

        if (stock !== undefined) {
            const [invCheck] = await pool.query('SELECT id_inventario FROM inventario WHERE id_producto = ?', [req.params.id]);
            if (invCheck.length > 0) {
                await pool.query('UPDATE inventario SET cantidad_disponible = ?, fecha_actualizacion = NOW() WHERE id_producto = ?', [stock, req.params.id]);
            } else {
                await pool.query(
                    `INSERT INTO inventario (id_producto, cantidad_disponible, cantidad_minima, cantidad_maxima, ubicacion, fecha_actualizacion, id_usuario)
                     VALUES (?, ?, 5, 1000, 'bodega a', NOW(), 1)`,
                    [req.params.id, stock]
                );
            }
        }

        res.json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/productos/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query("UPDATE producto SET estado='inactivo' WHERE id_producto=?", [req.params.id]);
        res.json({ mensaje: 'Producto desactivado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
