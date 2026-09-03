const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos del frontend (para abrir las páginas directamente desde el servidor si se desea)
app.use(express.static(path.join(__dirname, '..')));

// Importar Rutas
const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const clientesRoutes = require('./routes/clientes');
const proveedoresRoutes = require('./routes/proveedores');
const pedidosRoutes = require('./routes/pedidos');
const usuariosRoutes = require('./routes/usuarios');
const reportesRoutes = require('./routes/reportes');
const carritoRoutes = require('./routes/carrito');

// Registrar Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/carrito', carritoRoutes);

// Ruta de estado / Ping
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API Almacen El Baraton en ejecución', timestamp: new Date() });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error global no capturado:', err);
    res.status(err.status || 500).json({ error: err.message || 'Ocurrió un error inesperado en el servidor' });
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(` Servidor API El Baratón listo`);
    console.log(` URL Base API: http://localhost:${PORT}/api`);
    console.log(` Acceso Web:   http://localhost:${PORT}/inicio/inicio.html`);
});
