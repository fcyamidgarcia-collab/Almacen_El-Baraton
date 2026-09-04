// Script para arreglar columnas NOT NULL en la BD
const pool = require('./db');

async function fixDB() {
    try {
        // Permitir NULL en id_proveedor de producto
        await pool.query('ALTER TABLE producto MODIFY id_proveedor INT NULL');
        console.log('✅ producto.id_proveedor ahora acepta NULL');

        // Permitir NULL en id_usuario de cliente para registros directos de admin
        await pool.query('ALTER TABLE cliente MODIFY id_usuario INT NULL');
        console.log('✅ cliente.id_usuario ahora acepta NULL');

        // Permitir NULL o default en apellido de cliente
        await pool.query("ALTER TABLE cliente MODIFY apellido VARCHAR(100) NULL DEFAULT ''");
        console.log('✅ cliente.apellido ahora acepta NULL / default vacío');

        // Agregar columna correo a cliente si no existe
        const [correoCols] = await pool.query("SHOW COLUMNS FROM cliente LIKE 'correo'");
        if (correoCols.length === 0) {
            await pool.query("ALTER TABLE cliente ADD COLUMN correo VARCHAR(150) NULL AFTER documento_identidad");
            console.log('✅ Columna correo agregada a tabla cliente');
        } else {
            console.log('ℹ️ Columna correo ya existe en tabla cliente');
        }

        // Verificar proveedores existentes
        const [provs] = await pool.query('SELECT id_proveedor, nombre_proveedor FROM proveedor LIMIT 5');
        console.log('📦 Proveedores en la BD:', provs);

        // Verificar categorias
        const [cats] = await pool.query('SELECT id_categoria, nombre_categoria FROM categoria LIMIT 5');
        console.log('📂 Categorías en la BD:', cats);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
}

fixDB();
