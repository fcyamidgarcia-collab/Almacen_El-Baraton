// ========== PANEL VENDEDOR - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function insigniaStock(stock) {
        const n = Number(stock) || 0;
        if (n === 0) return '<span class="estado estado-pendiente">● agotado</span>';
        if (n < 10) return '<span class="estado estado-procesando">● stock bajo</span>';
        return '<span class="estado estado-enviado">● en stock</span>';
    }

    function insigniaEstadoPedido(estado) {
        const e = (estado || '').toLowerCase();
        if (e.includes('pend')) return `<span class="estado estado-pendiente">● ${estado}</span>`;
        if (e.includes('proces') || e.includes('en proceso')) return `<span class="estado estado-procesando">● ${estado}</span>`;
        if (e.includes('envi') || e.includes('complet')) return `<span class="estado estado-enviado">● ${estado}</span>`;
        if (e.includes('cancel')) return `<span class="estado estado-pendiente">● ${estado}</span>`;
        return `<span class="estado">${estado}</span>`;
    }

    // ---- Mostrar nombre del vendedor logueado ----
    const usuario = API.getUsuarioActual();
    if (usuario) {
        const nombreEl = document.getElementById('vendedor-nombre');
        const rolEl = document.getElementById('vendedor-rol');
        if (nombreEl) nombreEl.textContent = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
        if (rolEl) rolEl.textContent = usuario.rol_nombre || usuario.nombre_rol || 'Vendedor';
    }

    // ---- Navegación del sidebar ----
    const elementos = document.querySelectorAll('.elemento-menu[data-target]');
    const vistas = document.querySelectorAll('.vista-panel');

    elementos.forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            elementos.forEach(m => m.classList.remove('activo'));
            el.classList.add('activo');
            const target = el.getAttribute('data-target');
            vistas.forEach(v => {
                v.style.display = v.id === `vista-${target}` ? 'block' : 'none';
            });
        });
    });

    // ---- KPIs del resumen ----
    async function cargarKPIs() {
        try {
            const stats = await API.getDashboardStats();

            const ventasEl = document.getElementById('kpi-ventas');
            if (ventasEl) ventasEl.textContent = fmt(stats.ventas_mes?.total_ventas || 0);

            const pedidosEl = document.getElementById('kpi-pedidos');
            if (pedidosEl) pedidosEl.textContent = stats.total_pedidos || 0;

            const pedidosPendEl = document.getElementById('kpi-pedidos-sub');
            if (pedidosPendEl) pedidosPendEl.textContent = `${stats.pedidos_pendientes || 0} pendientes`;

            const stockEl = document.getElementById('kpi-stock');
            if (stockEl) stockEl.textContent = (stats.total_productos || 0).toLocaleString('es-CO');

            const provsEl = document.getElementById('kpi-proveedores');
            if (provsEl) provsEl.textContent = stats.total_proveedores || 0;

        } catch (err) {
            console.warn('Error cargando KPIs vendedor:', err.message);
        }
    }

    // ---- Tabla de pedidos ----
    async function cargarPedidos(busqueda = '') {
        const tbody = document.getElementById('tbody-pedidos');
        if (!tbody) return;
        try {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos...</td></tr>`;
            const pedidos = await API.getPedidos();

            const filtrados = busqueda
                ? pedidos.filter(p =>
                    String(p.id_pedido).includes(busqueda) ||
                    (`${p.nombre_cliente || ''} ${p.apellido_cliente || ''}`).toLowerCase().includes(busqueda.toLowerCase())
                )
                : pedidos;

            tbody.innerHTML = '';
            if (filtrados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b">No hay pedidos registrados.</td></tr>`;
                return;
            }

            filtrados.forEach(p => {
                const tr = document.createElement('tr');
                const cliente = `${p.nombre_cliente || ''} ${p.apellido_cliente || ''}`.trim() || 'Sin cliente';
                const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-CO') : 'N/A';
                tr.innerHTML = `
                    <td><strong>#${p.id_pedido}</strong></td>
                    <td>${cliente}</td>
                    <td><strong>${fmt(p.total)}</strong></td>
                    <td>${insigniaEstadoPedido(p.estado_pedido)}</td>
                    <td>${fecha}</td>
                    <td>
                        <button class="btn-accion btn-ver-pedido" data-id="${p.id_pedido}" title="Ver detalles">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <select class="seleccion-estado-pedido" data-id="${p.id_pedido}" style="font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid #e2e8f0;margin-left:4px">
                            <option value="pendiente" ${p.estado_pedido === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en_proceso" ${p.estado_pedido === 'en_proceso' || p.estado_pedido === 'en proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="enviado" ${p.estado_pedido === 'enviado' ? 'selected' : ''}>Enviado</option>
                            <option value="entregado" ${p.estado_pedido === 'entregado' ? 'selected' : ''}>Entregado</option>
                            <option value="cancelado" ${p.estado_pedido === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Cambiar estado de pedido
            document.querySelectorAll('.seleccion-estado-pedido').forEach(sel => {
                sel.addEventListener('change', async function() {
                    const id = this.getAttribute('data-id');
                    try {
                        await API.actualizarEstadoPedido(id, this.value);
                        await cargarPedidos(busqueda);
                    } catch (err) { alert('Error al actualizar estado: ' + err.message); }
                });
            });

        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</td></tr>`;
        }
    }

    // ---- Búsqueda en pedidos ----
    const busquedaPedido = document.getElementById('busqueda-pedidos');
    if (busquedaPedido) {
        busquedaPedido.addEventListener('input', () => cargarPedidos(busquedaPedido.value));
    }

    // ---- Tabla de proveedores ----
    async function cargarProveedores() {
        const tbody = document.getElementById('tbody-proveedores');
        if (!tbody) return;
        try {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando proveedores...</td></tr>`;
            const provs = await API.getProveedores();

            tbody.innerHTML = '';
            if (provs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b">No hay proveedores registrados.</td></tr>`;
                return;
            }
            provs.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${p.nombre_proveedor}</strong></td>
                    <td>${p.correo ? `<a href="mailto:${p.correo}" style="color:var(--naranja)">${p.correo}</a>` : p.telefono || 'Sin contacto'}</td>
                    <td>${p.telefono || 'N/A'}</td>
                    <td><span class="texto-verde">★ 5.0</span></td>
                    <td><span class="estado estado-enviado">● Activo</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444">Error: ${err.message}</td></tr>`;
        }
    }

    // ---- Tabla de stock ----
    async function cargarStock() {
        const tbody = document.getElementById('tbody-stock');
        if (!tbody) return;
        try {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando inventario...</td></tr>`;
            const productos = await API.getProductos();

            tbody.innerHTML = '';
            if (productos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b">No hay productos registrados.</td></tr>`;
                return;
            }
            productos.forEach(p => {
                const stock = Number(p.stock) || 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <strong>${p.nombre_producto}</strong><br>
                        <span style="font-size:0.75rem;color:var(--texto-secundario)">#${p.id_producto}</span>
                    </td>
                    <td>${p.nombre_categoria || 'Sin categoría'}</td>
                    <td>${p.nombre_proveedor || 'N/A'}</td>
                    <td><strong>${stock}</strong></td>
                    <td>${insigniaStock(stock)}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444">Error: ${err.message}</td></tr>`;
        }
    }

    // ---- Cerrar sesión ----
    const btnCerrar = document.querySelector('.texto-peligro');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => { e.preventDefault(); API.cerrarSesion(); });
    }

    // ---- Tabla de mensajes (Mock temporal para la BD) ----
    async function cargarMensajes() {
        const tbody = document.getElementById('tbody-mensajes');
        if (!tbody) return;
        try {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes...</td></tr>`;
            
            // Simulación de datos que vendrían de la BD
            const mensajes = [
                { id: 1, fecha: '2026-09-01', nombre: 'Juan Pérez', email: 'juan@empresa.com', asunto: 'Cotización taladros', mensaje: 'Me gustaría una cotización para 10 taladros percutores.' },
                { id: 2, fecha: '2026-09-02', nombre: 'María Gómez', email: 'maria@construccion.com', asunto: 'Duda sobre envío', mensaje: '¿Hacen envíos a zonas rurales?' },
                { id: 3, fecha: '2026-09-03', nombre: 'Carlos Ruiz', email: 'carlos.ruiz@taller.net', asunto: 'Garantía de productos', mensaje: 'Quisiera saber el tiempo de garantía de las pulidoras.' }
            ];

            tbody.innerHTML = '';
            if (mensajes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#64748b">No hay mensajes.</td></tr>`;
                return;
            }
            mensajes.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${m.fecha}</td>
                    <td><strong>${m.nombre}</strong></td>
                    <td><a href="mailto:${m.email}" style="color:var(--naranja)">${m.email}</a></td>
                    <td>${m.asunto}</td>
                    <td><button class="btn-accion" title="Ver mensaje" onclick="alert('Mensaje de ${m.nombre}:\\n\\n${m.mensaje}')" style="background: none; border: none; cursor: pointer; color: #3b82f6;"><i class="fas fa-eye"></i> Leer</button></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;color:#ef4444">Error: ${err.message}</td></tr>`;
        }
    }

    // ---- Carga inicial ----
    await cargarKPIs();
    await cargarPedidos();
    await cargarProveedores();
    await cargarStock();
    await cargarMensajes();
});
