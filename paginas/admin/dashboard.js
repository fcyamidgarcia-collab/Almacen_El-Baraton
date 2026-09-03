// ========== DASHBOARD ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function normalizarEstado(estado) {
        const e = (estado || 'pendiente').toLowerCase();
        if (e.includes('en_proceso') || e.includes('proces')) return { etiqueta: 'Procesando', clase: 'estado-procesando' };
        if (e.includes('envi')) return { etiqueta: 'Enviado', clase: 'estado-enviado' };
        if (e.includes('entreg') || e.includes('complet')) return { etiqueta: 'Completada', clase: 'estado-enviado' };
        if (e.includes('cancel')) return { etiqueta: 'Cancelado', clase: 'estado-cancelado' };
        return { etiqueta: 'Pendiente', clase: 'estado-pendiente' };
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

    // ---- Cargar categorías del filtro desde la BD ----
    async function cargarCategoriasDashboard() {
        try {
            const cats = await API.getCategorias();
            const sel = document.getElementById('filtroCategoríaDashboard');
            if (!sel) return;
            sel.innerHTML = '<option value="all">Todas las categorías</option>';
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_categoria;
                opt.textContent = c.nombre_categoria.charAt(0).toUpperCase() + c.nombre_categoria.slice(1);
                sel.appendChild(opt);
            });
            // Filtrar tabla al cambiar selección
            sel.addEventListener('change', () => cargarProductosDestacados(sel.value));
        } catch (e) { console.warn('Error cargando categorías dashboard:', e.message); }
    }

    // ---- Tabla de productos más vendidos desde la BD ----
    async function cargarProductosDestacados(categoriaId = 'all') {
        const tbody2 = document.getElementById('cuerpoTablaProductosDestacados');
        if (!tbody2) return;
        try {
            tbody2.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;
            const params = categoriaId !== 'all' ? { id_categoria: categoriaId } : {};
            const prods = await API.getProductos(params);
            if (!prods || prods.length === 0) {
                tbody2.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b">Sin productos registrados.</td></tr>`;
                return;
            }
            tbody2.innerHTML = '';
            prods.slice(0, 8).forEach((p, i) => {
                const stock = Number(p.stock) || 0;
                const estadoStock = stock === 0
                    ? '<span class="estado estado-agotado">Agotado</span>'
                    : stock < 10
                    ? '<span class="estado estado-bajo">Stock Bajo</span>'
                    : '<span class="estado estado-normal">En Stock</span>';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong style="color:var(--naranja)">${i + 1}</strong></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px">
                            <img src="${p.imagen || '../Almacen/img/hero.jpg'}" alt="${p.nombre_producto}"
                                style="width:36px;height:36px;border-radius:6px;object-fit:cover;"
                                onerror="this.src='../Almacen/img/hero.jpg'">
                            <span>${p.nombre_producto}</span>
                        </div>
                    </td>
                    <td>${p.nombre_categoria || '—'}</td>
                    <td><strong>$ ${Number(p.precio || 0).toLocaleString('es-CO')}</strong></td>
                    <td>${estadoStock}</td>
                `;
                tbody2.appendChild(tr);
            });
        } catch (e) {
            if (tbody2) tbody2.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444">Error: ${e.message}</td></tr>`;
        }
    }

    // Botón cerrar sesión en sidebar
    const btnCerrar = document.querySelector('[data-action="cerrar-sesion"]') ||
        document.querySelector('.texto-peligro');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => { e.preventDefault(); API.cerrarSesion(); });
    }

    await cargarEstadisticas();
    await cargarCategoriasDashboard();
    await cargarProductosDestacados();
});
