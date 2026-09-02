const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categorias
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id_categoria, c.nombre_categoria, c.descripcion,
                   COUNT(p.id_producto) AS total_productos
            FROM categoria c
            LEFT JOIN producto p ON c.id_categoria = p.id_categoria AND p.estado = 'activo'
            GROUP BY c.id_categoria
            ORDER BY c.nombre_categoria ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/categorias/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM categoria WHERE id_categoria = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/categorias
router.post('/', async (req, res) => {
    try {
        const { nombre_categoria, descripcion } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categoria (nombre_categoria, descripcion) VALUES (?, ?)',
            [nombre_categoria, descripcion || null]
        );
        res.status(201).json({ mensaje: 'Categoría creada', id_categoria: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/categorias/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre_categoria, descripcion } = req.body;
        await pool.query(
            'UPDATE categoria SET nombre_categoria=?, descripcion=? WHERE id_categoria=?',
            [nombre_categoria, descripcion || null, req.params.id]
        );
        res.json({ mensaje: 'Categoría actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM categoria WHERE id_categoria=?', [req.params.id]);
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
