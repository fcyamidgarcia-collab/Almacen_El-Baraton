// Script para arreglar columnas NOT NULL en la BD
const pool = require('./db');

async function fixDB() {
    try {
        // Permitir NULL en id_proveedor de producto
        await pool.query('ALTER TABLE producto MODIFY id_proveedor INT NULL');
        console.log('✅ producto.id_proveedor ahora acepta NULL');

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
