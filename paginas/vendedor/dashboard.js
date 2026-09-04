// ========== PANEL VENDEDOR - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function insigniaStock(stock, min = 10) {
        const n = Number(stock) || 0;
        const minimo = Number(min) || 10;
        if (n === 0) return '<span class="estado estado-agotado">Agotado</span>';
        if (n <= minimo) return '<span class="estado estado-bajo">Stock bajo</span>';
        return '<span class="estado estado-enviado">En stock</span>';
    }

    function insigniaEstadoPedido(estado) {
        const e = (estado || '').toLowerCase().trim();
        if (e.includes('pend'))     return `<span class="estado estado-pendiente">${estado}</span>`;
        if (e.includes('proces') || e === 'en_proceso') return `<span class="estado estado-procesando">${estado}</span>`;
        if (e === 'enviado')        return `<span class="estado estado-enviado">${estado}</span>`;
        if (e === 'entregado')      return `<span class="estado estado-entregado">${estado}</span>`;
        if (e === 'cancelado')      return `<span class="estado estado-cancelado">${estado}</span>`;
        return `<span class="estado">${estado}</span>`;
    }

    function colorBotonEstado(estado) {
        const e = (estado || '').toLowerCase().trim();
        if (e.includes('pend'))    return 'btn-estado-pendiente';
        if (e.includes('proces') || e === 'en_proceso') return 'btn-estado-procesando';
        if (e === 'enviado')       return 'btn-estado-enviado';
        if (e === 'entregado')     return 'btn-estado-entregado';
        if (e === 'cancelado')     return 'btn-estado-cancelado';
        return '';
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
    const elementos = document.querySelectorAll('.item-menu[data-target], .elemento-menu[data-target]');
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
            const [stats, pedidos] = await Promise.all([API.getDashboardStats().catch(() => ({})), API.getPedidos().catch(() => [])]);

            // Ventas
            const ventasEl = document.getElementById('kpi-ventas');
            if (ventasEl) ventasEl.textContent = fmt(stats.ventas_mes?.total_ventas || 0);

            // Pedidos
            const total = pedidos.length;
            const pendientes  = pedidos.filter(p => (p.estado_pedido||'').toLowerCase().includes('pend')).length;
            const entregados  = pedidos.filter(p => (p.estado_pedido||'').toLowerCase() === 'entregado').length;
            const cancelados  = pedidos.filter(p => (p.estado_pedido||'').toLowerCase() === 'cancelado').length;
            const totalMonto  = pedidos.reduce((s,p) => s + Number(p.total||0), 0);
            const promedio    = total > 0 ? totalMonto / total : 0;
            const tasaExito   = total > 0 ? Math.round((entregados / total) * 100) : 0;

            const pedidosEl = document.getElementById('kpi-pedidos');
            if (pedidosEl) pedidosEl.textContent = total;

            const pedidosPendEl = document.getElementById('kpi-pedidos-sub');
            if (pedidosPendEl) pedidosPendEl.textContent = `${pendientes} pendientes`;

            const promedioEl = document.getElementById('kpi-promedio');
            if (promedioEl) promedioEl.textContent = fmt(promedio);

            const entregadosEl = document.getElementById('kpi-entregados');
            if (entregadosEl) entregadosEl.textContent = entregados;

            const tasaEl = document.getElementById('kpi-tasa');
            if (tasaEl) tasaEl.textContent = `${tasaExito}% tasa éxito`;

            const canceladosEl = document.getElementById('kpi-cancelados');
            if (canceladosEl) canceladosEl.textContent = cancelados;

            const stockEl = document.getElementById('kpi-stock');
            if (stockEl) stockEl.textContent = (stats.total_productos || 0).toLocaleString('es-CO');

            const provsEl = document.getElementById('kpi-proveedores');
            if (provsEl) provsEl.textContent = stats.total_proveedores || 0;

            // Barras de distribución de estados
            const conteos = {
                'Pendiente':  pendientes,
                'En Proceso': pedidos.filter(p => (p.estado_pedido||'').toLowerCase().includes('proce') || p.estado_pedido === 'en_proceso').length,
                'Enviado':    pedidos.filter(p => (p.estado_pedido||'').toLowerCase() === 'enviado').length,
                'Entregado':  entregados,
                'Cancelado':  cancelados,
            };
            const colores = { 'Pendiente':'#f59e0b','En Proceso':'#3b82f6','Enviado':'#6366f1','Entregado':'#10b981','Cancelado':'#ef4444' };
            const barrasEl = document.getElementById('barras-estados');
            if (barrasEl && total > 0) {
                barrasEl.innerHTML = Object.entries(conteos).map(([label, cnt]) => {
                    const pct = Math.round((cnt / total) * 100);
                    return `
                    <div class="fila-barra">
                        <span class="etiqueta-barra">${label}</span>
                        <div class="pista-barra">
                            <div class="relleno-barra" style="width:${pct}%;background:${colores[label]}"></div>
                        </div>
                        <span class="valor-barra">${cnt} <small>(${pct}%)</small></span>
                    </div>`;
                }).join('');
            } else if (barrasEl) {
                barrasEl.innerHTML = '<p style="padding:20px;text-align:center;color:#64748b">Sin datos de pedidos aún.</p>';
            }

            // Tabla de pedidos recientes (últimos 10)
            const tbodyR = document.getElementById('tbody-recientes');
            if (tbodyR) {
                const recientes = [...pedidos].sort((a,b) => new Date(b.fecha_pedido) - new Date(a.fecha_pedido)).slice(0,10);
                tbodyR.innerHTML = recientes.length === 0
                    ? `<tr><td colspan="5" style="text-align:center;padding:16px;color:#64748b">Sin pedidos recientes.</td></tr>`
                    : recientes.map(p => {
                        const cliente = `${p.nombre_cliente||''} ${p.apellido_cliente||''}`.trim() || 'Sin cliente';
                        const fecha = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString('es-CO') : 'N/A';
                        return `<tr>
                            <td><strong>#${p.id_pedido}</strong></td>
                            <td>${cliente}</td>
                            <td><strong>${fmt(p.total)}</strong></td>
                            <td>${insigniaEstadoPedido(p.estado_pedido)}</td>
                            <td>${fecha}</td>
                        </tr>`;
                    }).join('');
            }

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
                const estadoActual = p.estado_pedido || 'pendiente';
                tr.innerHTML = `
                    <td><strong>#${p.id_pedido}</strong></td>
                    <td>${cliente}</td>
                    <td><strong>${fmt(p.total)}</strong></td>
                    <td>${insigniaEstadoPedido(estadoActual)}</td>
                    <td>${fecha}</td>
                    <td>
                        <div class="grupo-botones-estado">
                            <button class="btn-accion btn-ver-pedido" data-id="${p.id_pedido}" title="Ver detalles">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                            <div class="dropdown-estado">
                                <button class="btn-cambiar-estado ${colorBotonEstado(estadoActual)}" data-id="${p.id_pedido}" title="Cambiar estado">
                                    ${estadoActual.charAt(0).toUpperCase() + estadoActual.slice(1).replace('_',' ')} <i class="fas fa-chevron-down" style="font-size:10px;margin-left:4px"></i>
                                </button>
                                <div class="menu-dropdown" id="menu-${p.id_pedido}">
                                    <button class="opcion-estado" data-id="${p.id_pedido}" data-val="pendiente">Pendiente</button>
                                    <button class="opcion-estado" data-id="${p.id_pedido}" data-val="en_proceso">En proceso</button>
                                    <button class="opcion-estado" data-id="${p.id_pedido}" data-val="enviado">Enviado</button>
                                    <button class="opcion-estado" data-id="${p.id_pedido}" data-val="entregado">Entregado</button>
                                    <button class="opcion-estado" data-id="${p.id_pedido}" data-val="cancelado">Cancelado</button>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Cambiar estado de pedido con dropdown
            document.querySelectorAll('.btn-cambiar-estado').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = this.getAttribute('data-id');
                    const menu = document.getElementById(`menu-${id}`);
                    // Cerrar todos los otros
                    document.querySelectorAll('.menu-dropdown.abierto').forEach(m => {
                        if (m !== menu) m.classList.remove('abierto');
                    });
                    menu.classList.toggle('abierto');
                });
            });

            document.querySelectorAll('.opcion-estado').forEach(opt => {
                opt.addEventListener('click', async function(e) {
                    e.stopPropagation();
                    const id = this.getAttribute('data-id');
                    const val = this.getAttribute('data-val');
                    try {
                        await API.actualizarEstadoPedido(id, val);
                        await cargarPedidos(busqueda);
                    } catch (err) { alert('Error al actualizar estado: ' + err.message); }
                });
            });

            // Cerrar dropdowns al hacer click fuera
            document.addEventListener('click', () => {
                document.querySelectorAll('.menu-dropdown.abierto').forEach(m => m.classList.remove('abierto'));
            }, { once: false });

        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No hay pedidos registrados en la base de datos.</td></tr>`;
        }
    }

    // ---- Búsqueda en pedidos ----
    const busquedaPedido = document.getElementById('busqueda-pedidos');
    if (busquedaPedido) {
        busquedaPedido.addEventListener('input', () => cargarPedidos(busquedaPedido.value));
    }

    // ---- Tabla de proveedores ----
    let listaProveedores = [];
    async function cargarProveedores(busqueda = '') {
        const tbody = document.getElementById('tbody-proveedores');
        if (!tbody) return;
        try {
            if (listaProveedores.length === 0 || !busqueda) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando proveedores...</td></tr>`;
                listaProveedores = await API.getProveedores();
            }

            const term = (busqueda || '').toLowerCase().trim();
            const provs = listaProveedores.filter(p => {
                if (!term) return true;
                const nombre = (p.nombre_proveedor || '').toLowerCase();
                const contacto = (p.contacto || '').toLowerCase();
                const correo = (p.correo || '').toLowerCase();
                const tel = (p.telefono || '').toLowerCase();
                const dir = (p.direccion || '').toLowerCase();
                return nombre.includes(term) || contacto.includes(term) || correo.includes(term) || tel.includes(term) || dir.includes(term);
            });

            tbody.innerHTML = '';
            if (provs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b">No se encontraron proveedores registrados.</td></tr>`;
                return;
            }
            provs.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${p.nombre_proveedor}</strong></td>
                    <td>${p.contacto || 'Sin contacto'}</td>
                    <td>${p.telefono || 'Sin teléfono'}</td>
                    <td>${p.correo ? `<a href="mailto:${p.correo}" style="color:var(--naranja);text-decoration:none">${p.correo}</a>` : 'Sin correo'}</td>
                    <td>${p.direccion || 'N/A'}</td>
                    <td><strong>${p.total_productos || 0}</strong> prod.</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No hay registros disponibles en la base de datos.</td></tr>`;
        }
    }

    const busquedaProv = document.getElementById('busqueda-proveedores');
    if (busquedaProv) {
        busquedaProv.addEventListener('input', () => cargarProveedores(busquedaProv.value));
    }

    // ---- Tabla de stock ----
    let listaStock = [];
    async function cargarStock(busqueda = '') {
        const tbody = document.getElementById('tbody-stock');
        if (!tbody) return;
        try {
            if (listaStock.length === 0 || !busqueda) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando inventario...</td></tr>`;
                try {
                    listaStock = await API.getInventario();
                } catch (e) {
                    listaStock = await API.getProductos();
                }
            }

            const term = (busqueda || '').toLowerCase().trim();
            const productos = listaStock.filter(p => {
                if (!term) return true;
                const nombre = (p.nombre_producto || '').toLowerCase();
                const id = String(p.id_producto || '');
                const cat = (p.nombre_categoria || '').toLowerCase();
                const prov = (p.nombre_proveedor || '').toLowerCase();
                return nombre.includes(term) || id.includes(term) || cat.includes(term) || prov.includes(term);
            });

            tbody.innerHTML = '';
            if (productos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b">No se encontraron productos en el inventario.</td></tr>`;
                return;
            }
            productos.forEach(p => {
                const stock = Number(p.cantidad_disponible !== undefined ? p.cantidad_disponible : p.stock) || 0;
                const min = Number(p.cantidad_minima) || 10;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <strong>${p.nombre_producto}</strong><br>
                        <span style="font-size:0.75rem;color:var(--texto-secundario)">ID: #${p.id_producto}</span>
                    </td>
                    <td>${p.nombre_categoria || 'Sin categoría'}</td>
                    <td><strong>${fmt(p.precio)}</strong></td>
                    <td>${p.nombre_proveedor || 'N/A'}</td>
                    <td><strong>${stock}</strong>${p.cantidad_minima !== undefined ? ` <small style="color:var(--texto-secundario)">(mín. ${min})</small>` : ''}</td>
                    <td>${insigniaStock(stock, min)}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748b;">No hay registros disponibles en la base de datos.</td></tr>`;
        }
    }

    const busquedaStk = document.getElementById('busqueda-stock');
    if (busquedaStk) {
        busquedaStk.addEventListener('input', () => cargarStock(busquedaStk.value));
    }

    // ---- Cerrar sesión ----
    const btnCerrar = document.querySelector('.texto-peligro');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', (e) => { e.preventDefault(); API.cerrarSesion(); });
    }

    // ---- Tabla de mensajes conectada a la base de datos ----
    let listaMensajes = [];
    async function cargarMensajes(busqueda = '') {
        const tbody = document.getElementById('tbody-mensajes');
        if (!tbody) return;
        try {
            if (listaMensajes.length === 0 || !busqueda) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes de contacto...</td></tr>`;
                listaMensajes = await API.getMensajesContacto();
            }
            
            const term = (busqueda || '').toLowerCase().trim();
            const filtrados = listaMensajes.filter(m => {
                if (!term) return true;
                const nom = (m.nombre_completo || m.nombre || '').toLowerCase();
                const em = (m.email || '').toLowerCase();
                const asu = (m.asunto || '').toLowerCase();
                const tel = (m.telefono || '').toLowerCase();
                const msg = (m.mensaje || '').toLowerCase();
                return nom.includes(term) || em.includes(term) || asu.includes(term) || tel.includes(term) || msg.includes(term);
            });

            tbody.innerHTML = '';
            if (filtrados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b">No se encontraron mensajes de contacto.</td></tr>`;
                return;
            }

            filtrados.forEach(m => {
                const idMsg = m.id_contacto || m.id;
                const nombre = m.nombre_completo || m.nombre || 'Sin nombre';
                const email = m.email || 'Sin correo';
                const telefono = m.telefono || 'N/A';
                const asunto = m.asunto || 'General';
                const mensaje = m.mensaje || '';
                const leido = Number(m.leido) === 1;
                const fecha = m.fecha_envio || m.fecha;
                const fechaStr = fecha ? new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Reciente';

                const tr = document.createElement('tr');
                if (!leido) {
                    tr.style.backgroundColor = 'rgba(59, 130, 246, 0.04)';
                }

                tr.innerHTML = `
                    <td><small style="color:var(--texto-secundario)">${fechaStr}</small></td>
                    <td><strong>${nombre}</strong></td>
                    <td><a href="mailto:${email}" style="color:var(--naranja);text-decoration:none;">${email}</a></td>
                    <td>${telefono}</td>
                    <td><span class="estado estado-procesando" style="font-size:0.75rem">${asunto}</span></td>
                    <td>${leido ? '<span class="estado estado-entregado" style="font-size:0.75rem">Leído</span>' : '<span class="estado estado-pendiente" style="font-weight:600;font-size:0.75rem">Nuevo</span>'}</td>
                    <td>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-accion btn-leer-mensaje" data-id="${idMsg}" title="Ver contenido completo" style="color: #3b82f6;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <a href="mailto:${email}?subject=Respuesta a: ${encodeURIComponent(asunto)}" class="btn-accion" title="Responder por correo" style="color: #10b981; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                                <i class="fas fa-reply"></i>
                            </a>
                            <button class="btn-accion btn-borrar-mensaje" data-id="${idMsg}" title="Eliminar mensaje" style="color: #ef4444;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;

                // Evento para leer mensaje y marcar como leído
                tr.querySelector('.btn-leer-mensaje').addEventListener('click', async () => {
                    alert(`📬 Mensaje de: ${nombre}\n📧 Correo: ${email}\n📞 Teléfono: ${telefono}\n📌 Asunto: ${asunto}\n🗓 Fecha: ${fechaStr}\n\n📝 MENSAJE:\n${mensaje}`);
                    if (!leido) {
                        await API.marcarLeidoMensaje(idMsg, true);
                        listaMensajes = [];
                        await cargarMensajes(busqueda);
                    }
                });

                // Evento para eliminar
                tr.querySelector('.btn-borrar-mensaje').addEventListener('click', async () => {
                    if (confirm(`¿Estás seguro de eliminar el mensaje de "${nombre}"?`)) {
                        await API.eliminarMensajeContacto(idMsg);
                        listaMensajes = [];
                        await cargarMensajes(busqueda);
                    }
                });

                tbody.appendChild(tr);
            });
        } catch (err) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">No hay mensajes de contacto registrados.</td></tr>`;
        }
    }

    const busquedaMsg = document.getElementById('busqueda-mensajes');
    if (busquedaMsg) {
        busquedaMsg.addEventListener('input', () => cargarMensajes(busquedaMsg.value));
    }

    // ---- Carga inicial ----
    await cargarKPIs();
    await cargarPedidos();
    await cargarProveedores();
    await cargarStock();
    await cargarMensajes();
});
