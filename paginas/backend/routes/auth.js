const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'almacen_el_baraton_secret_key_2026';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Debes proporcionar correo y contraseña' });
        }

        // Buscar usuario por correo y unir con rol
        const [users] = await pool.query(
            `SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.correo, u.contrasena, u.estado,
                    r.nombre_rol
             FROM usuario u
             LEFT JOIN rol r ON u.id_rol = r.id_rol
             WHERE u.correo = ? LIMIT 1`,
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: `Usuario no encontrado con el correo: ${email}` });
        }

        const usuario = users[0];

        if (usuario.estado && usuario.estado.toLowerCase() !== 'activo') {
            return res.status(403).json({ error: 'Tu cuenta está inactiva o bloqueada. Contacta al administrador.' });
        }

        // Validar contraseña con bcrypt
        const hashGuardado = usuario.contrasena || '';
        let esValida = false;

        if (hashGuardado.startsWith('$2a$') || hashGuardado.startsWith('$2b$')) {
            // Contraseña hasheada correctamente
            esValida = await bcrypt.compare(password, hashGuardado);
        } else {
            // Contraseña en texto plano legada: comparar y migrar al hash
            esValida = (password === hashGuardado);
            if (esValida) {
                // Migrar automáticamente a hash bcrypt
                const nuevoHash = await bcrypt.hash(password, 12);
                await pool.query('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [nuevoHash, usuario.id_usuario]);
            }
        }

        if (!esValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Obtener cliente si existe
        const [clientes] = await pool.query('SELECT * FROM cliente WHERE id_usuario = ? LIMIT 1', [usuario.id_usuario]);
        const cliente = clientes[0] || null;

        const rolNombre = usuario.nombre_rol || (usuario.id_rol === 1 ? 'Administrador' : (usuario.id_rol === 2 ? 'Empleado' : 'Cliente'));

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, correo: usuario.correo, rol: rolNombre },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        delete usuario.contrasena;

        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: nombreCompleto,
                email: usuario.correo,
                correo: usuario.correo,
                rol_nombre: rolNombre,
                rol: rolNombre,
                cliente
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: `Error en la base de datos: ${error.message}` });
    }
});

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion, ciudad, nit } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }

        const [existentes] = await pool.query('SELECT id_usuario FROM usuario WHERE correo = ?', [email.trim()]);
        if (existentes.length > 0) {
            return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
        }

        // Hashear contraseña con bcrypt antes de guardar
        const contrasenaHash = await bcrypt.hash(String(password).trim(), 12);
        const partesNombre = nombre.trim().split(' ');
        const pNombre = partesNombre[0] || nombre;
        const pApellido = partesNombre.slice(1).join(' ') || '';

        // Rol 3 = cliente
        const [resultUser] = await pool.query(
            `INSERT INTO usuario (id_rol, nombre, apellido, correo, contrasena, fecha_registro, estado)
             VALUES (3, ?, ?, ?, ?, NOW(), 'activo')`,
            [pNombre, pApellido, email.trim(), contrasenaHash]
        );

        const id_usuario = resultUser.insertId;

        // Registrar en tabla cliente
        const [resCli] = await pool.query(
            `INSERT INTO cliente (id_usuario, nombre, apellido, documento_identidad, telefono, direccion, ciudad, fecha_registro, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'activo')`,
            [id_usuario, pNombre, pApellido, nit || null, telefono || null, direccion || null, ciudad || 'Bogotá']
        );

        const token = jwt.sign(
            { id_usuario, correo: email, rol: 'cliente' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id_usuario,
                nombre,
                email,
                correo: email,
                rol_nombre: 'cliente',
                rol: 'cliente',
                cliente: {
                    id_cliente: resCli.insertId,
                    id_usuario,
                    nombre: pNombre,
                    apellido: pApellido,
                    telefono: telefono || null,
                    direccion: direccion || null,
                    ciudad: ciudad || 'Bogotá'
                }
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: `Error al registrar: ${error.message}` });
    }
});

// GET /api/auth/perfil/:id_usuario
router.get('/perfil/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const [users] = await pool.query(
            `SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.fecha_registro, u.estado, r.nombre_rol
             FROM usuario u
             LEFT JOIN rol r ON u.id_rol = r.id_rol
             WHERE u.id_usuario = ? LIMIT 1`,
            [id_usuario]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/perfil/:id_usuario - Actualizar datos personales y de cliente
router.put('/perfil/:id_usuario', async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { nombre, apellido, telefono, direccion, ciudad, documento_identidad } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        // Actualizar tabla usuario
        await pool.query(
            'UPDATE usuario SET nombre = ?, apellido = ? WHERE id_usuario = ?',
            [nombre.trim(), apellido ? apellido.trim() : '', id_usuario]
        );

        // Actualizar o insertar tabla cliente
        const [cliRows] = await pool.query('SELECT id_cliente FROM cliente WHERE id_usuario = ? LIMIT 1', [id_usuario]);
        if (cliRows.length > 0) {
            await pool.query(
                `UPDATE cliente SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, ciudad = ?, documento_identidad = COALESCE(?, documento_identidad)
                 WHERE id_usuario = ?`,
                [nombre.trim(), apellido ? apellido.trim() : '', telefono || null, direccion || null, ciudad || 'Bogotá', documento_identidad || null, id_usuario]
            );
        } else {
            await pool.query(
                `INSERT INTO cliente (id_usuario, nombre, apellido, documento_identidad, telefono, direccion, ciudad, fecha_registro, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'activo')`,
                [id_usuario, nombre.trim(), apellido ? apellido.trim() : '', documento_identidad || `CC-${Date.now().toString().slice(-8)}`, telefono || null, direccion || null, ciudad || 'Bogotá']
            );
        }

        res.json({ mensaje: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/auth/cambiar-contrasena
router.put('/cambiar-contrasena', async (req, res) => {
    try {
        const { id_usuario, actualPassword, nuevaPassword } = req.body;

        if (!id_usuario || !actualPassword || !nuevaPassword) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const [users] = await pool.query('SELECT contrasena FROM usuario WHERE id_usuario = ?', [id_usuario]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const hashGuardado = users[0].contrasena || '';
        let valida = false;
        if (hashGuardado.startsWith('$2a$') || hashGuardado.startsWith('$2b$')) {
            valida = await bcrypt.compare(actualPassword, hashGuardado);
        } else {
            valida = (actualPassword === hashGuardado);
        }

        if (!valida) {
            return res.status(400).json({ error: 'La contraseña actual no es correcta' });
        }

        // Hashear la nueva contraseña antes de guardar
        const contrasenaHash = await bcrypt.hash(String(nuevaPassword).trim(), 12);
        await pool.query('UPDATE usuario SET contrasena = ? WHERE id_usuario = ?', [contrasenaHash, id_usuario]);

        res.json({ mensaje: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
