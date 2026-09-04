const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// GET /api/usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.tipo_documento, u.documento_identidad,
                   u.correo, u.fecha_registro, u.estado,
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
            SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.tipo_documento, u.documento_identidad,
                   u.correo, u.fecha_registro, u.estado,
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

async function hasColumn(table, column) {
    try {
        const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
        return rows.length > 0;
    } catch { return false; }
}

// POST /api/usuarios - Crear usuario
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, correo, contrasena, id_rol, tipo_documento, documento_identidad, numero_documento } = req.body;
        // Hashear contraseña con bcrypt
        const contrasenaHash = await bcrypt.hash(String(contrasena).trim(), 12);
        const hasTipoDoc = await hasColumn('usuario', 'tipo_documento');
        const hasDoc = await hasColumn('usuario', 'documento_identidad');
        const docValor = documento_identidad || numero_documento || null;

        let result;
        if (hasTipoDoc && hasDoc) {
            [result] = await pool.query(
                `INSERT INTO usuario (id_rol, nombre, apellido, correo, contrasena, tipo_documento, documento_identidad, fecha_registro, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'activo')`,
                [id_rol || 3, nombre, apellido || '', correo, contrasenaHash, tipo_documento || 'CC', docValor]
            );
        } else if (hasTipoDoc) {
            [result] = await pool.query(
                `INSERT INTO usuario (id_rol, nombre, apellido, correo, contrasena, tipo_documento, fecha_registro, estado)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), 'activo')`,
                [id_rol || 3, nombre, apellido || '', correo, contrasenaHash, tipo_documento || 'CC']
            );
        } else {
            [result] = await pool.query(
                `INSERT INTO usuario (id_rol, nombre, apellido, correo, contrasena, fecha_registro, estado)
                 VALUES (?, ?, ?, ?, ?, NOW(), 'activo')`,
                [id_rol || 3, nombre, apellido || '', correo, contrasenaHash]
            );
        }
        res.status(201).json({ mensaje: 'Usuario creado exitosamente', id_usuario: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { nombre, apellido, correo, id_rol, estado, contrasena, tipo_documento, documento_identidad, numero_documento } = req.body;
        const hasTipoDoc = await hasColumn('usuario', 'tipo_documento');
        const hasDoc = await hasColumn('usuario', 'documento_identidad');
        const docValor = documento_identidad || numero_documento || null;

        let contrasenaHash = null;
        if (contrasena) {
            contrasenaHash = await bcrypt.hash(String(contrasena).trim(), 12);
        }

        let updateQuery = 'UPDATE usuario SET nombre=?, apellido=?, correo=?, id_rol=?, estado=?';
        const params = [nombre, apellido || '', correo, id_rol, estado || 'activo'];

        if (contrasenaHash) {
            updateQuery += ', contrasena=?';
            params.push(contrasenaHash);
        }
        if (hasTipoDoc && tipo_documento) {
            updateQuery += ', tipo_documento=?';
            params.push(tipo_documento);
        }
        if (hasDoc && docValor !== undefined) {
            updateQuery += ', documento_identidad=?';
            params.push(docValor);
        }

        updateQuery += ' WHERE id_usuario=?';
        params.push(req.params.id);

        await pool.query(updateQuery, params);

        // Sincronizar en la tabla cliente si existe
        const hasTipoDocCli = await hasColumn('cliente', 'tipo_documento');
        let updateCliSql = 'UPDATE cliente SET nombre=?, apellido=?';
        const cliParams = [nombre, apellido || ''];

        if (hasTipoDocCli && tipo_documento) {
            updateCliSql += ', tipo_documento=?';
            cliParams.push(tipo_documento);
        }
        if (docValor) {
            updateCliSql += ', documento_identidad=?';
            cliParams.push(docValor);
        }
        updateCliSql += ' WHERE id_usuario=?';
        cliParams.push(req.params.id);

        try {
            await pool.query(updateCliSql, cliParams);
        } catch (_) {}

        res.json({ mensaje: 'Usuario y cliente sincronizados exitosamente' });
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
