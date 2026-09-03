// ========== REPORTES ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    async function cargarReportes() {
        try {
            // Dashboard stats
            const stats = await API.getDashboardStats();

            // Inventario
            const inventario = await API.getInventario();

            // Tabla de inventario
            const tbodyInv = document.getElementById('cuerpoTablaInventario');
            if (tbodyInv && inventario.length > 0) {
                tbodyInv.innerHTML = '';
                inventario.forEach(item => {
                    const tr = document.createElement('tr');
                    const estadoClase = item.estado_stock === 'sin_stock' ? 'estado-agotado'
                        : item.estado_stock === 'stock_bajo' ? 'estado-bajo' : 'estado-normal';
                    const estadoTexto = item.estado_stock === 'sin_stock' ? 'Sin Stock'
                        : item.estado_stock === 'stock_bajo' ? 'Stock Bajo' : 'Normal';
                    tr.innerHTML = `
                        <td>${item.nombre_producto}</td>
                        <td>${item.nombre_categoria || 'Sin cat.'}</td>
                        <td><strong>${item.cantidad_disponible}</strong></td>
                        <td>${item.cantidad_minima}</td>
                        <td>${item.ubicacion || 'N/A'}</td>
                        <td><span class="estado ${estadoClase}">${estadoTexto}</span></td>
                    `;
                    tbodyInv.appendChild(tr);
                });
            }

            // KPIs de ventas
            const ventasEl = document.getElementById('totalVentasMes');
            if (ventasEl) ventasEl.textContent = fmt(stats.ventas_mes?.total_ventas || 0);

            const numVentasEl = document.getElementById('numVentasMes');
            if (numVentasEl) numVentasEl.textContent = stats.ventas_mes?.num_ventas || 0;

            // Top productos
            const tbodyTop = document.getElementById('cuerpoTopProductos');
            if (tbodyTop && stats.top_productos?.length > 0) {
                tbodyTop.innerHTML = '';
                stats.top_productos.forEach((p, i) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${i + 1}</td>
                        <td>${p.nombre_producto}</td>
                        <td><strong>${p.total_vendido}</strong> unidades</td>
                        <td>${fmt(p.ingresos)}</td>
                    `;
                    tbodyTop.appendChild(tr);
                });
            }

            // Stock bajo - alertas
            const listaStockBajo = document.getElementById('listaStockBajo');
            if (listaStockBajo && stats.stock_bajo?.length > 0) {
                listaStockBajo.innerHTML = '';
                stats.stock_bajo.forEach(p => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${p.nombre_producto}</strong>: ${p.cantidad_disponible} unidades (mínimo: ${p.cantidad_minima})`;
                    listaStockBajo.appendChild(li);
                });
            }

        } catch (err) {
            console.error('Error cargando reportes:', err.message);
        }
    }

    await cargarReportes();
});
