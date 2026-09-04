const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/clientes
router.get('/', async (req, res) => {
    try {
        const hasCorreoCli = await hasColumn('cliente', 'correo');
        const correoExpr = hasCorreoCli ? 'COALESCE(c.correo, u.correo)' : 'u.correo';
        const [rows] = await pool.query(`
            SELECT c.id_cliente, c.id_usuario, c.nombre, c.apellido, c.tipo_documento, c.documento_identidad,
                   c.telefono, c.direccion, c.ciudad, c.fecha_registro, c.estado,
                   ${correoExpr} AS correo,
                   COUNT(DISTINCT p.id_pedido) AS total_pedidos
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            LEFT JOIN pedido p ON c.id_cliente = p.id_cliente
            GROUP BY c.id_cliente
            ORDER BY c.fecha_registro DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
    try {
        const hasCorreoCli = await hasColumn('cliente', 'correo');
        const correoExpr = hasCorreoCli ? 'COALESCE(c.correo, u.correo)' : 'u.correo';
        const [rows] = await pool.query(`
            SELECT c.*, ${correoExpr} AS correo
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_cliente = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/usuario/:id_usuario - Obtener cliente por id_usuario
router.get('/usuario/:id_usuario', async (req, res) => {
    try {
        const hasCorreoCli = await hasColumn('cliente', 'correo');
        const correoExpr = hasCorreoCli ? 'COALESCE(c.correo, u.correo)' : 'u.correo';
        const [rows] = await pool.query(`
            SELECT c.*, ${correoExpr} AS correo
            FROM cliente c
            LEFT JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_usuario = ? LIMIT 1
        `, [req.params.id_usuario]);
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/clientes/:id/pedidos - Historial de pedidos del cliente
router.get('/:id/pedidos', async (req, res) => {
    try {
        const [pedidos] = await pool.query(`
            SELECT pe.id_pedido, pe.fecha_pedido, pe.direccion_entrega, pe.estado_pedido, pe.total, pe.observaciones,
                   v.id_venta, v.fecha_venta, v.estado AS estado_venta
            FROM pedido pe
            LEFT JOIN venta v ON pe.id_venta = v.id_venta
            WHERE pe.id_cliente = ?
            ORDER BY pe.fecha_pedido DESC
        `, [req.params.id]);

        for (let p of pedidos) {
            const [detalles] = await pool.query(`
                SELECT dp.*, pr.nombre_producto, pr.imagen, pr.precio
                FROM detalle_pedido dp
                LEFT JOIN producto pr ON dp.id_producto = pr.id_producto
                WHERE dp.id_pedido = ?
            `, [p.id_pedido]);
            p.items = detalles;
        }

        res.json(pedidos);
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

// POST /api/clientes
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, documento_identidad, tipo_documento, numero_documento, telefono, direccion, ciudad, estado, correo } = req.body;
        const docFinal = documento_identidad || (tipo_documento && numero_documento ? `${tipo_documento}: ${numero_documento}` : null);
        const hasTipoDoc = await hasColumn('cliente', 'tipo_documento');
        const hasCorreo = await hasColumn('cliente', 'correo');

        // Si se suministró correo, verificar si ya pertenece a un usuario existente para vincularlo
        let id_usuario = null;
        if (correo && correo.trim()) {
            const [usr] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ? LIMIT 1', [correo.trim()]);
            if (usr.length > 0) {
                id_usuario = usr[0].id_usuario;
            }
        }

        const cols = ['nombre', 'apellido', 'documento_identidad', 'telefono', 'direccion', 'ciudad', 'estado', 'fecha_registro'];
        const vals = [nombre, apellido || '', docFinal, telefono || null, direccion || null, ciudad || null, estado || 'activo', new Date()];

        if (id_usuario) {
            cols.push('id_usuario');
            vals.push(id_usuario);
        }
        if (hasTipoDoc && tipo_documento) {
            cols.push('tipo_documento');
            vals.push(tipo_documento);
        }
        if (hasCorreo) {
            cols.push('correo');
            vals.push(correo && correo.trim() ? correo.trim() : null);
        }

        const placeholders = cols.map(() => '?').join(', ');
        const [result] = await pool.query(
            `INSERT INTO cliente (${cols.join(', ')}) VALUES (${placeholders})`,
            vals
        );

        res.status(201).json({ mensaje: 'Cliente creado exitosamente', id_cliente: result.insertId });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    try {
        const { nombre, apellido, documento_identidad, tipo_documento, numero_documento, telefono, direccion, ciudad, estado, correo } = req.body;
        const docFinal = documento_identidad || (tipo_documento && numero_documento ? `${tipo_documento}: ${numero_documento}` : null);
        const numDocLimpio = numero_documento || (docFinal && docFinal.includes(':') ? docFinal.split(':')[1].trim() : docFinal);

        const hasTipoDoc = await hasColumn('cliente', 'tipo_documento');
        const hasCorreo = await hasColumn('cliente', 'correo');

        let updateCliSql = 'UPDATE cliente SET nombre=?, apellido=?, documento_identidad=?, telefono=?, direccion=?, ciudad=?, estado=?';
        const cliParams = [nombre, apellido || '', docFinal || null, telefono || null, direccion || null, ciudad || null, estado || 'activo'];

        if (hasTipoDoc && tipo_documento) {
            updateCliSql += ', tipo_documento=?';
            cliParams.push(tipo_documento);
        }
        if (hasCorreo) {
            updateCliSql += ', correo=?';
            cliParams.push(correo && correo.trim() ? correo.trim() : null);
        }

        // Si no tiene id_usuario vinculado y se pasa correo, intentar vincular si existe en usuario
        const [cliActual] = await pool.query('SELECT id_usuario FROM cliente WHERE id_cliente = ? LIMIT 1', [req.params.id]);
        if (cliActual.length > 0 && !cliActual[0].id_usuario && correo && correo.trim()) {
            const [usr] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ? LIMIT 1', [correo.trim()]);
            if (usr.length > 0) {
                updateCliSql += ', id_usuario=?';
                cliParams.push(usr[0].id_usuario);
            }
        }

        updateCliSql += ' WHERE id_cliente=?';
        cliParams.push(req.params.id);

        await pool.query(updateCliSql, cliParams);

        // 2. Sincronizar automáticamente en la tabla usuario si está vinculado
        const [cliRows] = await pool.query('SELECT id_usuario FROM cliente WHERE id_cliente = ? LIMIT 1', [req.params.id]);
        if (cliRows.length > 0 && cliRows[0].id_usuario) {
            const id_usuario = cliRows[0].id_usuario;
            const hasTipoDocUsr = await hasColumn('usuario', 'tipo_documento');
            const hasDocUsr = await hasColumn('usuario', 'documento_identidad');

            let updateUsrSql = 'UPDATE usuario SET nombre=?, apellido=?';
            const usrParams = [nombre, apellido || ''];

            if (hasTipoDocUsr && tipo_documento) {
                updateUsrSql += ', tipo_documento=?';
                usrParams.push(tipo_documento);
            }
            if (hasDocUsr && numDocLimpio) {
                updateUsrSql += ', documento_identidad=?';
                usrParams.push(numDocLimpio);
            }
            if (correo && correo.trim()) {
                updateUsrSql += ', correo=?';
                usrParams.push(correo.trim());
            }
            updateUsrSql += ' WHERE id_usuario=?';
            usrParams.push(id_usuario);

            await pool.query(updateUsrSql, usrParams);
        }

        res.json({ mensaje: 'Cliente y usuario sincronizados exitosamente' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/clientes/:id (desactivar)
router.delete('/:id', async (req, res) => {
    try {
        await pool.query("UPDATE cliente SET estado='inactivo' WHERE id_cliente=?", [req.params.id]);
        res.json({ mensaje: 'Cliente desactivado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
