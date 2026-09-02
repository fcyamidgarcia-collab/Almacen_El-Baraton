// ========== DASHBOARD ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function normalizarEstado(estado) {
        const e = (estado || 'pendiente').toLowerCase();
        if (e.includes('en_proceso') || e.includes('proces')) return { etiqueta: '● procesando', clase: 'estado-procesando' };
        if (e.includes('envi')) return { etiqueta: '● enviado', clase: 'estado-enviado' };
        if (e.includes('entreg') || e.includes('complet')) return { etiqueta: '● completada', clase: 'estado-enviado' };
        if (e.includes('cancel')) return { etiqueta: '● cancelado', clase: 'estado-cancelado' };
        return { etiqueta: '● pendiente', clase: 'estado-pendiente' };
    }

    async function cargarEstadisticas() {
        try {
            // Cargar estadísticas globales y lista de pedidos en paralelo
            const [stats, pedidosBD] = await Promise.all([
                API.getDashboardStats().catch(() => null),
                API.getPedidos().catch(() => [])
            ]);

            const pedidos = pedidosBD || [];
            const totalVentas = pedidos.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
            const totalPedidos = pedidos.length;
            const pedidosPendientes = pedidos.filter(p => (p.estado_pedido || '').toLowerCase() === 'pendiente').length;
            const totalClientes = stats?.total_clientes || 4;
            const totalProductos = stats?.total_productos || 10;

            // 1. Asignar valores a las 4 tarjetas KPI principales
            const elVentas = document.getElementById('kpiTotalVentas');
            const elPedidos = document.getElementById('kpiConteoPedidos');
            const elPendientes = document.getElementById('kpiTextoPendientes');
            const elClientes = document.getElementById('kpiClientes');
            const elProductos = document.getElementById('kpiProductos');
            const subtituloPend = document.getElementById('subtituloPedidosPendientes');

            if (elVentas) elVentas.textContent = fmt(totalVentas);
            if (elPedidos) elPedidos.textContent = totalPedidos;
            if (elPendientes) elPendientes.textContent = `${pedidosPendientes} pendientes`;
            if (elClientes) elClientes.textContent = totalClientes;
            if (elProductos) elProductos.textContent = totalProductos;
            if (subtituloPend) subtituloPend.textContent = `${pedidosPendientes} pedidos pendientes`;

            // 2. Asignar insignias numéricas de la barra lateral (Sidebar)
            const bPedidos = document.getElementById('insigniaPedidosBarra');
            const bProductos = document.getElementById('insigniaProductosBarra');
            const bClientes = document.getElementById('insigniaClientesBarra');

            if (bPedidos) bPedidos.textContent = totalPedidos;
            if (bProductos) bProductos.textContent = totalProductos;
            if (bClientes) bClientes.textContent = totalClientes;

            // 3. Tabla de Pedidos Recientes
            const tbody = document.getElementById('cuerpoTablaUltimosPedidos');
            if (tbody) {
                if (pedidos.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#64748b;">No hay pedidos registrados en la base de datos.</td></tr>`;
                } else {
                    tbody.innerHTML = '';
                    pedidos.slice(0, 5).forEach(p => {
                        const tr = document.createElement('tr');
                        const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-CO') : 'Sin fecha';
                        const cliente = `${p.nombre_cliente || ''} ${p.apellido_cliente || ''}`.trim() || 'Cliente General';
                        const st = normalizarEstado(p.estado_pedido);

                        tr.innerHTML = `
                            <td><strong style="color:var(--naranja); cursor:pointer;" onclick="window.location.href='pedidos.html'">#${p.id_pedido}</strong></td>
                            <td>${cliente}</td>
                            <td><strong>${fmt(p.total)}</strong></td>
                            <td><span class="estado ${st.clase}">${st.etiqueta}</span></td>
                            <td>${fecha}</td>
                            <td><a href="pedidos.html" class="boton-accion" title="Ver Pedidos"><i class="fas fa-eye"></i></a></td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            }

        } catch (error) {
            console.error('Error cargando dashboard:', error);
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
