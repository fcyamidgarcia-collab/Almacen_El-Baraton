// REPORTES ADMIN - CONECTADO A MYSQL 

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function escaparHtml(valor) {
        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function generarPDF(stats, inventario) {
        const ventana = window.open('', '_blank', 'width=1000,height=800');
        if (!ventana) {
            alert('Permite las ventanas emergentes para generar el PDF.');
            return;
        }

        const ventasMes = stats.ventas_mes || {};
        const stockBajo = (stats.stock_bajo || []).map(item => `
            <tr>
                <td>${escaparHtml(item.nombre_producto)}</td>
                <td>${item.cantidad_disponible}</td>
                <td>${item.cantidad_minima}</td>
            </tr>
        `).join('');

        const productosTop = (stats.top_productos || []).map((item, indice) => `
            <tr>
                <td>${indice + 1}</td>
                <td>${escaparHtml(item.nombre_producto)}</td>
                <td>${item.total_vendido}</td>
                <td>${fmt(item.ingresos)}</td>
            </tr>
        `).join('');

        const inventarioRows = inventario.map(item => `
            <tr>
                <td>${escaparHtml(item.nombre_producto)}</td>
                <td>${escaparHtml(item.nombre_categoria || 'Sin categoría')}</td>
                <td>${item.cantidad_disponible}</td>
                <td>${item.cantidad_minima}</td>
                <td>${escaparHtml(item.estado_stock)}</td>
            </tr>
        `).join('');

        ventana.document.write(`<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Almacen El Baraton</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #172033; margin: 0; font-size: 11px; }
        header { border-bottom: 3px solid #e67e22; padding-bottom: 12px; margin-bottom: 18px; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        h2 { font-size: 15px; color: #e67e22; margin: 22px 0 8px; border-bottom: 1px solid #d9dee7; padding-bottom: 5px; }
        p { margin: 3px 0; color: #526075; }
        .fecha { font-size: 10px; }
        .resumen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .indicador { border: 1px solid #d9dee7; border-radius: 5px; padding: 9px; background: #f7f9fc; }
        .indicador strong { display: block; font-size: 15px; color: #172033; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 7px; }
        th { background: #172033; color: white; text-align: left; }
        th, td { border: 1px solid #d9dee7; padding: 6px 7px; }
        tr { page-break-inside: avoid; }
        .vacio { color: #68758a; font-style: italic; }
        footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #d9dee7; font-size: 9px; color: #68758a; }
        @media print { .no-imprimir { display: none; } }
    </style>
</head>
<body>
    <header>
        <h1>Almacen El Baraton</h1>
        <p>Reporte consolidado de ventas e inventario</p>
        <p class="fecha">Generado: ${new Date().toLocaleString('es-CO')}</p>
    </header>
    <section class="resumen">
        <div class="indicador">Ventas del mes<strong>${fmt(ventasMes.total_ventas)}</strong></div>
        <div class="indicador">Número de ventas<strong>${ventasMes.num_ventas || 0}</strong></div>
        <div class="indicador">Clientes activos<strong>${stats.total_clientes || 0}</strong></div>
        <div class="indicador">Pedidos pendientes<strong>${stats.pedidos_pendientes || 0}</strong></div>
    </section>
    <h2>Productos más vendidos</h2>
    ${productosTop ? `<table><thead><tr><th>#</th><th>Producto</th><th>Unidades</th><th>Ingresos</th></tr></thead><tbody>${productosTop}</tbody></table>` : '<p class="vacio">No hay ventas registradas.</p>'}
    <h2>Alertas de stock bajo</h2>
    ${stockBajo ? `<table><thead><tr><th>Producto</th><th>Disponible</th><th>Mínimo</th></tr></thead><tbody>${stockBajo}</tbody></table>` : '<p class="vacio">No hay alertas de stock bajo.</p>'}
    <h2>Inventario actual</h2>
    ${inventarioRows ? `<table><thead><tr><th>Producto</th><th>Categoría</th><th>Disponible</th><th>Mínimo</th><th>Estado</th></tr></thead><tbody>${inventarioRows}</tbody></table>` : '<p class="vacio">No hay datos de inventario.</p>'}
    <footer>Documento generado desde el panel administrativo de Almacen El Baraton.</footer>
</body>
</html>`);
        ventana.document.close();
        ventana.focus();
        ventana.onload = () => ventana.print();
    }

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

    const btnDescargarPDF = document.getElementById('btnDescargarPDF');
    if (btnDescargarPDF) {
        btnDescargarPDF.addEventListener('click', async () => {
            btnDescargarPDF.disabled = true;
            const textoOriginal = btnDescargarPDF.innerHTML;
            btnDescargarPDF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando PDF...';
            try {
                const [stats, inventario] = await Promise.all([
                    API.getDashboardStats(),
                    API.getInventario()
                ]);
                generarPDF(stats, inventario || []);
            } catch (error) {
                alert('No se pudo generar el reporte: ' + error.message);
            } finally {
                btnDescargarPDF.disabled = false;
                btnDescargarPDF.innerHTML = textoOriginal;
            }
        });
    }
});
