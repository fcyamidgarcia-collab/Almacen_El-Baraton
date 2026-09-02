const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/proveedores
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT pr.id_proveedor, pr.nombre_proveedor, pr.contacto, pr.telefono, pr.correo, pr.direccion,
                   COUNT(DISTINCT p.id_producto) AS total_productos
            FROM proveedor pr
            LEFT JOIN producto p ON pr.id_proveedor = p.id_proveedor
            GROUP BY pr.id_proveedor
            ORDER BY pr.nombre_proveedor ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/proveedores/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM proveedor WHERE id_proveedor = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/proveedores
router.post('/', async (req, res) => {
    try {
        const { nombre_proveedor, contacto, telefono, correo, direccion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO proveedor (nombre_proveedor, contacto, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?)',
            [nombre_proveedor, contacto || null, telefono || null, correo || null, direccion || null]
        );
        res.status(201).json({ mensaje: 'Proveedor creado', id_proveedor: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/proveedores/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre_proveedor, contacto, telefono, correo, direccion } = req.body;
        await pool.query(
            'UPDATE proveedor SET nombre_proveedor=?, contacto=?, telefono=?, correo=?, direccion=? WHERE id_proveedor=?',
            [nombre_proveedor, contacto || null, telefono || null, correo || null, direccion || null, req.params.id]
        );
        res.json({ mensaje: 'Proveedor actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/proveedores/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM proveedor WHERE id_proveedor=?', [req.params.id]);
        res.json({ mensaje: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
