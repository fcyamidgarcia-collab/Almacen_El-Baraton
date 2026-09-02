const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones a MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Admin123456',
    database: process.env.DB_NAME || 'almacen_el_baraton',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
});

// Probar conexión inicial
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a MySQL (Base de datos: ' + (process.env.DB_NAME || 'almacen_el_baraton') + ')');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        console.error('Asegúrate de haber importado el archivo database.sql y que el servicio de MySQL esté corriendo en el puerto 3306.');
    }
})();

module.exports = pool;
