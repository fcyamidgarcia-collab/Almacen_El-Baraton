const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categorias - incluye campo imagen
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id_categoria, c.nombre_categoria, c.descripcion, c.imagen,
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

// POST /api/categorias - guarda imagen
router.post('/', async (req, res) => {
    try {
        const { nombre_categoria, descripcion, imagen } = req.body;
        const [result] = await pool.query(
            'INSERT INTO categoria (nombre_categoria, descripcion, imagen) VALUES (?, ?, ?)',
            [nombre_categoria, descripcion || null, imagen || null]
        );
        res.status(201).json({ mensaje: 'Categoría creada', id_categoria: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/categorias/:id - actualiza imagen
router.put('/:id', async (req, res) => {
    try {
        const { nombre_categoria, descripcion, imagen } = req.body;
        await pool.query(
            'UPDATE categoria SET nombre_categoria=?, descripcion=?, imagen=? WHERE id_categoria=?',
            [nombre_categoria, descripcion || null, imagen || null, req.params.id]
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
