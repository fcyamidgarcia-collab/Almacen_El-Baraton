// Middleware de Autenticación JWT
// Verifica token y valida permisos de acceso

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'almacen_el_baraton_secret_key_2026';

/**
 * Middleware: Verificar si el usuario está autenticado
 */
const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({ 
                error: 'No autorizado: Token no proporcionado',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return res.status(401).json({ 
            error: 'Token inválido o expirado',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Middleware: Verificar que sea Admin (id_rol = 1)
 */
const esAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const rol = (req.usuario.rol || '').toLowerCase();
    if (rol !== 'administrador' && rol !== 'admin') {
        return res.status(403).json({ 
            error: 'Acceso denegado: Se requieren permisos de administrador',
            code: 'FORBIDDEN_ADMIN'
        });
    }

    next();
};

/**
 * Middleware: Verificar que sea Empleado/Vendedor (id_rol = 2)
 */
const esEmpleado = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const rol = (req.usuario.rol || '').toLowerCase();
    if (rol !== 'empleado' && rol !== 'vendedor') {
        return res.status(403).json({ 
            error: 'Acceso denegado: Se requieren permisos de empleado',
            code: 'FORBIDDEN_EMPLEADO'
        });
    }

    next();
};

/**
 * Middleware: Verificar que sea Admin o Empleado
 */
const esAdminOEmpleado = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    const rol = (req.usuario.rol || '').toLowerCase();
    const esValido = ['administrador', 'admin', 'empleado', 'vendedor'].includes(rol);
    
    if (!esValido) {
        return res.status(403).json({ 
            error: 'Acceso denegado: Se requieren permisos de administrador o empleado',
            code: 'FORBIDDEN_STAFF'
        });
    }

    next();
};

module.exports = {
    verificarToken,
    esAdmin,
    esEmpleado,
    esAdminOEmpleado
};
