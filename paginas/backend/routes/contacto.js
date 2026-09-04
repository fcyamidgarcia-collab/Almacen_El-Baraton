const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/contacto - Obtener todos los mensajes de contacto
router.get('/', async (req, res) => {
    try {
        const [mensajes] = await pool.query(`
            SELECT id_contacto, nombre_completo, email, telefono, asunto, mensaje, 
                   IFNULL(leido, 0) AS leido, fecha_envio
            FROM contacto
            ORDER BY fecha_envio DESC
        `);
        res.json(mensajes);
    } catch (error) {
        console.error('Error al obtener mensajes de contacto:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/contacto - Guardar un nuevo mensaje de contacto
router.post('/', async (req, res) => {
    try {
        const { id_usuario, nombre_completo, nombre, email, telefono, asunto, mensaje } = req.body;
        const nombreFinal = (nombre_completo || nombre || '').trim();

        if (!nombreFinal || !email || !mensaje) {
            return res.status(400).json({ error: 'Nombre, email y mensaje son campos obligatorios' });
        }

        const [resultado] = await pool.query(
            `INSERT INTO contacto (id_usuario, nombre_completo, email, telefono, asunto, mensaje, fecha_envio)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [id_usuario || null, nombreFinal, email.trim(), telefono ? telefono.trim() : null, asunto || 'Otro', mensaje.trim()]
        );

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado y registrado exitosamente',
            id_contacto: resultado.insertId
        });
    } catch (error) {
        console.error('Error al guardar mensaje de contacto:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/contacto/:id/leido - Marcar mensaje como leído / no leído
router.put('/:id/leido', async (req, res) => {
    try {
        const { id } = req.params;
        const { leido } = req.body;
        const nuevoEstado = leido !== undefined ? (leido ? 1 : 0) : 1;

        await pool.query(
            'UPDATE contacto SET leido = ? WHERE id_contacto = ?',
            [nuevoEstado, id]
        );

        res.json({ success: true, message: 'Estado del mensaje actualizado' });
    } catch (error) {
        console.error('Error al actualizar estado del mensaje:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/contacto/:id - Eliminar mensaje de contacto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [resultado] = await pool.query(
            'DELETE FROM contacto WHERE id_contacto = ?',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }

        res.json({ success: true, message: 'Mensaje eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar mensaje de contacto:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
