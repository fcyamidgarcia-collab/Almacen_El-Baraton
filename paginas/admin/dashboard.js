// ========== DASHBOARD ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    async function cargarEstadisticas() {
        try {
            const stats = await API.getDashboardStats();

            // KPIs
            const kpis = document.querySelectorAll('.tarjeta-kpi .valor-kpi');
            if (kpis.length >= 4) {
                kpis[0].textContent = fmt(stats.ventas_mes?.total_ventas || 0);
                kpis[1].textContent = stats.pedidos_pendientes || 0;
                kpis[2].textContent = stats.total_clientes || 0;
                kpis[3].textContent = stats.total_productos || 0;
            }

            // Tabla de últimas ventas
            const tbody = document.querySelector('.tarjeta-datos table tbody');
            if (tbody && stats.ultimas_ventas?.length > 0) {
                tbody.innerHTML = '';
                stats.ultimas_ventas.forEach(v => {
                    const tr = document.createElement('tr');
                    const fecha = new Date(v.fecha_venta).toLocaleDateString('es-CO');
                    const cliente = `${v.nombre_cliente || ''} ${v.apellido_cliente || ''}`.trim() || 'Sin cliente';
                    tr.innerHTML = `
                        <td><strong>#${v.id_venta}</strong></td>
                        <td>${cliente}</td>
                        <td><strong>${fmt(v.total)}</strong></td>
                        <td><span class="estado estado-${v.estado === 'completada' ? 'enviado' : 'pendiente'}">● ${v.estado}</span></td>
                        <td>${fecha}</td>
                        <td style="text-align:center"><a href="pedidos.html" class="boton-accion" title="Ver"><i class="fas fa-eye"></i></a></td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            // Alertas de stock bajo
            if (stats.stock_bajo?.length > 0) {
                console.info('⚠️ Productos con stock bajo:', stats.stock_bajo.map(p => p.nombre_producto).join(', '));
            }

        } catch (error) {
            console.warn('Error cargando dashboard:', error.message);
        }
    }

    // Botón cerrar sesión en sidebar
    const btnCerrar = document.querySelector('[data-action="cerrar-sesion"]') ||
        document.querySelector('.texto-peligro');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => { e.preventDefault(); API.cerrarSesion(); });
    }

    await cargarEstadisticas();
});
