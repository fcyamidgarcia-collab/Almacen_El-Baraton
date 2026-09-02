const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// GET /api/usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.fecha_registro, u.estado,
                   r.nombre_rol
            FROM usuario u
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.fecha_registro, u.estado,
                   r.nombre_rol
            FROM usuario u
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/usuarios - Crear usuario
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, correo, contrasena, id_rol } = req.body;
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const [result] = await pool.query(
            `INSERT INTO usuario (id_rol, nombre, apellido, correo, contrasena, fecha_registro, estado)
             VALUES (?, ?, ?, ?, ?, NOW(), 'activo')`,
            [id_rol || 3, nombre, apellido || '', correo, hashedPassword]
        );
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', id_usuario: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { nombre, apellido, correo, id_rol, estado, contrasena } = req.body;
        if (contrasena) {
            const hashed = await bcrypt.hash(contrasena, 10);
            await pool.query(
                'UPDATE usuario SET nombre=?, apellido=?, correo=?, id_rol=?, estado=?, contrasena=? WHERE id_usuario=?',
                [nombre, apellido || '', correo, id_rol, estado || 'activo', hashed, req.params.id]
            );
        } else {
            await pool.query(
                'UPDATE usuario SET nombre=?, apellido=?, correo=?, id_rol=?, estado=? WHERE id_usuario=?',
                [nombre, apellido || '', correo, id_rol, estado || 'activo', req.params.id]
            );
        }
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/usuarios/:id/toggle - Activar o desactivar usuario
router.put('/:id/toggle', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT estado FROM usuario WHERE id_usuario = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        const nuevoEstado = rows[0].estado === 'activo' ? 'inactivo' : 'activo';
        await pool.query('UPDATE usuario SET estado=? WHERE id_usuario=?', [nuevoEstado, req.params.id]);
        res.json({ mensaje: `Usuario ${nuevoEstado}`, estado: nuevoEstado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/usuarios/:id - Desactivar usuario
router.delete('/:id', async (req, res) => {
    try {
        await pool.query("UPDATE usuario SET estado='inactivo' WHERE id_usuario=?", [req.params.id]);
        res.json({ mensaje: 'Usuario desactivado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
