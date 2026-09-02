// =======================================================
// GESTIÓN DE PEDIDOS ADMIN - CONECTADO A MYSQL
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {
    let datosPedidos = [];
    let estadoFiltroActual = 'all';
    let terminoBusquedaActual = '';
    let ordenActual = 'date-desc';
    let paginaActual = 1;
    const itemsPorPagina = 7;
    let pedidoSeleccionadoActual = null;

    // Elementos DOM
    const cuerpoTablaPedidos = document.getElementById('cuerpoTablaPedidos');
    const estadoVacio = document.getElementById('estadoVacio');
    const tablaPedidos = document.getElementById('tablaPedidos');
    const pestanasEstado = document.querySelectorAll('.boton-pestana');
    const selectFiltroEstado = document.getElementById('selectFiltroEstado');
    const selectOrdenamiento = document.getElementById('selectOrdenamiento');
    const busquedaPedidoInput = document.getElementById('busquedaPedidoInput');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    const checkboxSeleccionarTodos = document.getElementById('checkboxSeleccionarTodos');

    // KPIs y Contadores
    const kpiTotalVentas = document.getElementById('kpiTotalVentas');
    const kpiConteoPedidos = document.getElementById('kpiConteoPedidos');
    const kpiTextoPendientes = document.getElementById('kpiTextoPendientes');
    const kpiClientes = document.getElementById('kpiClientes');
    const kpiProductos = document.getElementById('kpiProductos');
    const insigniaPedidosBarra = document.getElementById('insigniaPedidosBarra');
    const insigniaProductosBarra = document.getElementById('insigniaProductosBarra');
    const insigniaClientesBarra = document.getElementById('insigniaClientesBarra');
    const subtituloSeccionPrincipal = document.getElementById('subtituloSeccionPrincipal');

    const conteoTodos = document.getElementById('conteoTodos');
    const conteoPendiente = document.getElementById('conteoPendiente');
    const conteoProcesando = document.getElementById('conteoProcesando');
    const conteoEnviado = document.getElementById('conteoEnviado');
    const conteoEntregado = document.getElementById('conteoEntregado');

    // Paginación
    const infoPaginacion = document.getElementById('infoPaginacion');
    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');
    const contenedorNumerosPagina = document.getElementById('contenedorNumerosPagina');

    // Modales
    const modalDetallePedido = document.getElementById('modalDetallePedido');
    const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');
    const btnCerrarModalDetallePie = document.getElementById('btnCerrarModalDetallePie');
    const btnActualizarEstadoModal = document.getElementById('btnActualizarEstadoModal');
    const btnImprimirPedido = document.getElementById('btnImprimirPedido');

    const modalNuevoPedido = document.getElementById('modalNuevoPedido');
    const btnNuevoPedido = document.getElementById('btnNuevoPedido');
    const btnCerrarModalNuevoPedido = document.getElementById('btnCerrarModalNuevoPedido');
    const btnCancelarNuevoPedido = document.getElementById('btnCancelarNuevoPedido');
    const formularioNuevoPedido = document.getElementById('formularioNuevoPedido');
    const btnExportar = document.getElementById('btnExportar');

    function formatearMoneda(monto) {
        return '$ ' + Number(monto || 0).toLocaleString('es-CO');
    }

    function formatearFecha(fechaStr) {
        if (!fechaStr) return 'Sin fecha';
        const d = new Date(fechaStr);
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function normalizarEstado(estado) {
        const e = (estado || 'pendiente').toLowerCase();
        if (e.includes('en_proceso') || e.includes('proces')) return 'procesando';
        if (e.includes('envi')) return 'enviado';
        if (e.includes('entreg') || e.includes('complet')) return 'entregado';
        if (e.includes('cancel')) return 'cancelado';
        return 'pendiente';
    }

    // --- CARGAR DATOS DESDE MYSQL ---
    async function cargarPedidosDesdeBD() {
        try {
            if (cuerpoTablaPedidos) {
                cuerpoTablaPedidos.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos desde la base de datos...</td></tr>`;
            }

            // Consultar pedidos, clientes y productos en paralelo
            const [pedidosBD, clientesBD, productosBD] = await Promise.all([
                API.getPedidos(),
                API.getClientes().catch(() => []),
                API.getProductos().catch(() => [])
            ]);

            // Normalizar pedidos de la BD a formato frontend
            datosPedidos = (pedidosBD || []).map(p => {
                const nombreCliente = `${p.nombre_cliente || ''} ${p.apellido_cliente || ''}`.trim() || 'Cliente General';
                return {
                    id_raw: p.id_pedido,
                    id: `#ORD-${p.id_pedido}`,
                    id_cliente: p.id_cliente,
                    id_venta: p.id_venta,
                    cliente: nombreCliente,
                    contacto: p.nombre_cliente || 'N/A',
                    email: p.correo_cliente || 'cliente@baraton.com',
                    nit: p.documento_identidad || 'N/A',
                    telefono: p.telefono || 'N/A',
                    direccion: p.direccion_entrega || 'Dirección no registrada',
                    ciudad: p.ciudad || 'Bogotá D.C.',
                    metodoPago: p.observaciones?.includes('Transferencia') ? 'Transferencia Bancaria' : (p.observaciones?.includes('Nequi') ? 'Billetera Digital' : 'Pago Contra Entrega / Web'),
                    observaciones: p.observaciones || '',
                    estado: normalizarEstado(p.estado_pedido),
                    estado_original: p.estado_pedido,
                    total: parseFloat(p.total) || 0,
                    fecha: formatearFecha(p.fecha_pedido),
                    fecha_raw: p.fecha_pedido,
                    items: (p.items || []).map(i => ({
                        id_producto: i.id_producto,
                        sku: `PRD-${i.id_producto}`,
                        nombre: i.nombre_producto || 'Producto Industrial',
                        cantidad: i.cantidad || 1,
                        precio: parseFloat(i.precio_unitario || i.precio || 0)
                    }))
                };
            });

            // Actualizar métricas secundarias (Clientes y Productos)
            const totalClientes = clientesBD.length || 0;
            const totalProductos = productosBD.length || 0;

            if (kpiClientes) kpiClientes.textContent = totalClientes;
            if (kpiProductos) kpiProductos.textContent = totalProductos;
            if (insigniaClientesBarra) insigniaClientesBarra.textContent = totalClientes;
            if (insigniaProductosBarra) insigniaProductosBarra.textContent = totalProductos;

            renderizarTabla();
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            if (cuerpoTablaPedidos) {
                cuerpoTablaPedidos.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Error al conectar con MySQL: ${error.message}</td></tr>`;
            }
        }
    }

    // --- ACTUALIZAR KPIS Y CONTADORES ---
    function actualizarKPIs() {
        const totalVentas = datosPedidos.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
        const totalPedidos = datosPedidos.length;
        const pendientes = datosPedidos.filter(o => o.estado === 'pendiente').length;
        const procesando = datosPedidos.filter(o => o.estado === 'procesando').length;
        const enviados = datosPedidos.filter(o => o.estado === 'enviado').length;
        const entregados = datosPedidos.filter(o => o.estado === 'entregado').length;

        if (kpiTotalVentas) kpiTotalVentas.textContent = formatearMoneda(totalVentas);
        if (kpiConteoPedidos) kpiConteoPedidos.textContent = totalPedidos;
        if (kpiTextoPendientes) kpiTextoPendientes.textContent = `${pendientes} pendientes`;
        if (insigniaPedidosBarra) insigniaPedidosBarra.textContent = totalPedidos;
        if (subtituloSeccionPrincipal) subtituloSeccionPrincipal.textContent = `${pendientes} pedidos pendientes`;

        if (conteoTodos) conteoTodos.textContent = totalPedidos;
        if (conteoPendiente) conteoPendiente.textContent = pendientes;
        if (conteoProcesando) conteoProcesando.textContent = procesando;
        if (conteoEnviado) conteoEnviado.textContent = enviados;
        if (conteoEntregado) conteoEntregado.textContent = entregados;
    }

    // --- OBTENER BADGE HTML ---
    function obtenerInsigniaEstado(estado) {
        const mapa = {
            'pendiente': { etiqueta: '● Pendiente', clase: 'estado-pendiente' },
            'procesando': { etiqueta: '● Procesando', clase: 'estado-procesando' },
            'enviado': { etiqueta: '● Enviado', clase: 'estado-enviado' },
            'entregado': { etiqueta: '● Entregado', clase: 'estado-entregado' },
            'cancelado': { etiqueta: '● Cancelado', clase: 'estado-cancelado' }
        };
        const s = mapa[estado] || { etiqueta: `● ${estado}`, clase: 'estado-pendiente' };
        return `<span class="estado ${s.clase}">${s.etiqueta}</span>`;
    }

    // --- FILTRADO Y ORDENAMIENTO ---
    function obtenerPedidosFiltrados() {
        let lista = datosPedidos.filter(pedido => {
            const coincideEstado = (estadoFiltroActual === 'all') || (pedido.estado === estadoFiltroActual);
            const term = terminoBusquedaActual.toLowerCase();
            const coincideBusqueda = !term ||
                pedido.id.toLowerCase().includes(term) ||
                pedido.cliente.toLowerCase().includes(term) ||
                pedido.contacto.toLowerCase().includes(term) ||
                pedido.direccion.toLowerCase().includes(term) ||
                pedido.ciudad.toLowerCase().includes(term);

            return coincideEstado && coincideBusqueda;
        });

        // Ordenar
        lista.sort((a, b) => {
            if (ordenActual === 'date-desc') return new Date(b.fecha_raw) - new Date(a.fecha_raw);
            if (ordenActual === 'date-asc') return new Date(a.fecha_raw) - new Date(b.fecha_raw);
            if (ordenActual === 'total-desc') return b.total - a.total;
            if (ordenActual === 'total-asc') return a.total - b.total;
            return 0;
        });

        return lista;
    }

    // --- RENDERIZAR TABLA ---
    function renderizarTabla() {
        const filtrados = obtenerPedidosFiltrados();
        const totalItems = filtrados.length;
        const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;

        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const corteActual = filtrados.slice(inicio, fin);

        if (!cuerpoTablaPedidos) return;
        cuerpoTablaPedidos.innerHTML = '';

        if (corteActual.length === 0) {
            if (estadoVacio) estadoVacio.style.display = 'block';
            if (tablaPedidos) tablaPedidos.style.display = 'none';
        } else {
            if (estadoVacio) estadoVacio.style.display = 'none';
            if (tablaPedidos) tablaPedidos.style.display = 'table';

            corteActual.forEach(pedido => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="checkbox-pedido" data-id="${pedido.id_raw}"></td>
                    <td><span class="celda-id-pedido" style="cursor: pointer; font-weight: 600; color: #ea580c;" data-id="${pedido.id_raw}">${pedido.id}</span></td>
                    <td>
                        <div class="celda-cliente">
                            <span class="nombre-cliente">${pedido.cliente}</span>
                            <span class="subtexto-cliente">${pedido.direccion}</span>
                        </div>
                    </td>
                    <td><span class="celda-total" style="font-weight: 700;">${formatearMoneda(pedido.total)}</span></td>
                    <td>${obtenerInsigniaEstado(pedido.estado)}</td>
                    <td><span class="celda-fecha">${pedido.fecha}</span></td>
                    <td style="text-align: center;">
                        <div class="acciones-tabla">
                            <button class="boton-accion btn-ver-pedido" data-id="${pedido.id_raw}" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="boton-accion btn-imprimir-fila" data-id="${pedido.id_raw}" title="Ver Factura">
                                <i class="fas fa-file-invoice"></i>
                            </button>
                        </div>
                    </td>
                `;
                cuerpoTablaPedidos.appendChild(tr);
            });
        }

        // Conectar botones de ver detalle
        document.querySelectorAll('.btn-ver-pedido, .celda-id-pedido').forEach(elem => {
            elem.addEventListener('click', () => {
                const idRaw = elem.getAttribute('data-id');
                abrirModalDetalle(idRaw);
            });
        });

        // Conectar botones de factura directa
        document.querySelectorAll('.btn-imprimir-fila').forEach(btn => {
            btn.addEventListener('click', () => {
                const idRaw = btn.getAttribute('data-id');
                window.open(`../confirmacion/confirmacion.html?pedido=${idRaw}`, '_blank');
            });
        });

        actualizarPaginacion(totalItems, totalPaginas);
        actualizarKPIs();
    }

    // --- CONTROLES DE PAGINACIÓN ---
    function actualizarPaginacion(totalItems, totalPaginas) {
        if (!infoPaginacion) return;
        if (totalItems === 0) {
            infoPaginacion.textContent = 'Mostrando 0 pedidos';
            if (btnPaginaAnterior) btnPaginaAnterior.disabled = true;
            if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = true;
            if (contenedorNumerosPagina) contenedorNumerosPagina.innerHTML = '';
            return;
        }

        const inicio = (paginaActual - 1) * itemsPorPagina + 1;
        const fin = Math.min(paginaActual * itemsPorPagina, totalItems);
        infoPaginacion.textContent = `Mostrando ${inicio} - ${fin} de ${totalItems} pedidos`;

        if (btnPaginaAnterior) btnPaginaAnterior.disabled = (paginaActual <= 1);
        if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = (paginaActual >= totalPaginas);

        if (contenedorNumerosPagina) {
            contenedorNumerosPagina.innerHTML = '';
            for (let i = 1; i <= totalPaginas; i++) {
                const btn = document.createElement('button');
                btn.className = `numero-pagina ${i === paginaActual ? 'activo' : ''}`;
                btn.textContent = i;
                btn.addEventListener('click', () => {
                    paginaActual = i;
                    renderizarTabla();
                });
                contenedorNumerosPagina.appendChild(btn);
            }
        }
    }

    if (btnPaginaAnterior) {
        btnPaginaAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarTabla();
            }
        });
    }

    if (btnPaginaSiguiente) {
        btnPaginaSiguiente.addEventListener('click', () => {
            const filtrados = obtenerPedidosFiltrados();
            const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarTabla();
            }
        });
    }

    // --- MODAL DETALLE DE PEDIDO ---
    function actualizarStepper(estado) {
        const pasos = ['paso1', 'paso2', 'paso3', 'paso4'];
        const lineas = ['lineaPaso1', 'lineaPaso2', 'lineaPaso3'];

        pasos.forEach(p => {
            const el = document.getElementById(p);
            if (el) { el.classList.remove('completado', 'activo'); }
        });
        lineas.forEach(l => {
            const el = document.getElementById(l);
            if (el) { el.classList.remove('activo'); }
        });

        const p1 = document.getElementById('paso1');
        const p2 = document.getElementById('paso2');
        const p3 = document.getElementById('paso3');
        const p4 = document.getElementById('paso4');
        const l1 = document.getElementById('lineaPaso1');
        const l2 = document.getElementById('lineaPaso2');
        const l3 = document.getElementById('lineaPaso3');

        if (estado === 'pendiente') {
            if (p1) p1.classList.add('activo');
        } else if (estado === 'procesando') {
            if (p1) p1.classList.add('completado');
            if (l1) l1.classList.add('activo');
            if (p2) p2.classList.add('activo');
        } else if (estado === 'enviado') {
            if (p1) p1.classList.add('completado');
            if (l1) l1.classList.add('activo');
            if (p2) p2.classList.add('completado');
            if (l2) l2.classList.add('activo');
            if (p3) p3.classList.add('activo');
        } else if (estado === 'entregado') {
            if (p1) p1.classList.add('completado');
            if (l1) l1.classList.add('activo');
            if (p2) p2.classList.add('completado');
            if (l2) l2.classList.add('activo');
            if (p3) p3.classList.add('completado');
            if (l3) l3.classList.add('activo');
            if (p4) p4.classList.add('completado');
        }
    }

    async function abrirModalDetalle(idRaw) {
        const p = datosPedidos.find(o => String(o.id_raw) === String(idRaw));
        if (!p) return;
        pedidoSeleccionadoActual = p;

        document.getElementById('modalIdPedido').textContent = p.id;
        document.getElementById('modalEstadoPedido').innerHTML = obtenerInsigniaEstado(p.estado);
        document.getElementById('modalNombreCliente').textContent = p.cliente;
        document.getElementById('modalDocCliente').textContent = `Doc / NIT: ${p.nit}`;
        document.getElementById('modalNombreContacto').textContent = p.contacto;
        document.getElementById('modalEmailContacto').textContent = p.email;
        document.getElementById('modalDireccionEntrega').textContent = p.direccion;
        document.getElementById('modalCiudadEntrega').textContent = p.ciudad;
        document.getElementById('modalMetodoPago').textContent = p.metodoPago;
        document.getElementById('modalFechaPedido').textContent = p.fecha;

        actualizarStepper(p.estado);

        const cuerpoModalItems = document.getElementById('cuerpoTablaModalItems');
        if (cuerpoModalItems) {
            cuerpoModalItems.innerHTML = '';
            let subtotal = 0;

            if (p.items && p.items.length > 0) {
                p.items.forEach(item => {
                    const itTotal = item.cantidad * item.precio;
                    subtotal += itTotal;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><code>${item.sku}</code></td>
                        <td><strong>${item.nombre}</strong></td>
                        <td style="text-align: center;">${item.cantidad}</td>
                        <td style="text-align: right;">${formatearMoneda(item.precio)}</td>
                        <td style="text-align: right;"><strong>${formatearMoneda(itTotal)}</strong></td>
                    `;
                    cuerpoModalItems.appendChild(tr);
                });
            } else {
                cuerpoModalItems.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#64748b;">Sin desglose de items disponible</td></tr>`;
            }

            const total = p.total;
            const subtotalCalculado = subtotal > 0 ? subtotal : Math.round(total / 1.19);
            const ivaCalculado = total - subtotalCalculado;

            document.getElementById('modalSubtotal').textContent = formatearMoneda(subtotalCalculado);
            document.getElementById('modalImpuesto').textContent = formatearMoneda(ivaCalculado);
            document.getElementById('modalTotal').textContent = formatearMoneda(total);
        }

        const selectEstado = document.getElementById('selectModalEstado');
        if (selectEstado) {
            selectEstado.value = p.estado;
        }

        if (modalDetallePedido) modalDetallePedido.classList.add('activo');
    }

    // --- ACTUALIZAR ESTADO DEL PEDIDO EN MYSQL ---
    if (btnActualizarEstadoModal) {
        btnActualizarEstadoModal.addEventListener('click', async () => {
            if (!pedidoSeleccionadoActual) return;
            const nuevoEstado = document.getElementById('selectModalEstado').value;
            const originalHTML = btnActualizarEstadoModal.innerHTML;

            try {
                btnActualizarEstadoModal.disabled = true;
                btnActualizarEstadoModal.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando en BD...';

                await API.actualizarEstadoPedido(pedidoSeleccionadoActual.id_raw, nuevoEstado);

                alert(`¡Estado del pedido ${pedidoSeleccionadoActual.id} actualizado a '${nuevoEstado.toUpperCase()}' en la base de datos!`);
                if (modalDetallePedido) modalDetallePedido.classList.remove('activo');
                await cargarPedidosDesdeBD();
            } catch (err) {
                alert('Error al actualizar estado en la base de datos: ' + err.message);
            } finally {
                btnActualizarEstadoModal.disabled = false;
                btnActualizarEstadoModal.innerHTML = originalHTML;
            }
        });
    }

    if (btnImprimirPedido) {
        btnImprimirPedido.addEventListener('click', () => {
            if (pedidoSeleccionadoActual) {
                window.open(`../confirmacion/confirmacion.html?pedido=${pedidoSeleccionadoActual.id_raw}`, '_blank');
            }
        });
    }

    // --- FILTROS Y EVENT LISTENERS ---
    pestanasEstado.forEach(tab => {
        tab.addEventListener('click', function() {
            pestanasEstado.forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            estadoFiltroActual = this.getAttribute('data-status') || 'all';
            paginaActual = 1;
            renderizarTabla();
        });
    });

    if (selectFiltroEstado) {
        selectFiltroEstado.addEventListener('change', function() {
            estadoFiltroActual = this.value;
            pestanasEstado.forEach(t => {
                if ((t.getAttribute('data-status') || 'all') === estadoFiltroActual) {
                    t.classList.add('activo');
                } else {
                    t.classList.remove('activo');
                }
            });
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (selectOrdenamiento) {
        selectOrdenamiento.addEventListener('change', function() {
            ordenActual = this.value;
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (busquedaPedidoInput) {
        busquedaPedidoInput.addEventListener('input', function() {
            terminoBusquedaActual = this.value.trim().toLowerCase();
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', () => {
            estadoFiltroActual = 'all';
            terminoBusquedaActual = '';
            if (busquedaPedidoInput) busquedaPedidoInput.value = '';
            if (selectFiltroEstado) selectFiltroEstado.value = 'all';
            pestanasEstado.forEach((t, i) => t.classList.toggle('activo', i === 0));
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (checkboxSeleccionarTodos) {
        checkboxSeleccionarTodos.addEventListener('change', function() {
            document.querySelectorAll('.checkbox-pedido').forEach(cb => {
                cb.checked = checkboxSeleccionarTodos.checked;
            });
        });
    }

    // --- MODALES CERRAR / ABRIR ---
    if (btnCerrarModalDetalle) btnCerrarModalDetalle.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));
    if (btnCerrarModalDetallePie) btnCerrarModalDetallePie.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));

    if (btnNuevoPedido) btnNuevoPedido.addEventListener('click', () => {
        if (modalNuevoPedido) modalNuevoPedido.classList.add('activo');
    });
    if (btnCerrarModalNuevoPedido) btnCerrarModalNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));
    if (btnCancelarNuevoPedido) btnCancelarNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));

    // --- REGISTRAR NUEVO PEDIDO DESDE ADMIN ---
    if (formularioNuevoPedido) {
        formularioNuevoPedido.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSubmit = formularioNuevoPedido.querySelector('button[type="submit"]');
            const originalHTML = btnSubmit.innerHTML;

            const nombreEmpresa = document.getElementById('nuevoNombreCliente').value.trim();
            const responsable = document.getElementById('nuevoNombreContacto').value.trim();
            const email = document.getElementById('nuevoEmailContacto').value.trim();
            const direccion = document.getElementById('nuevaDireccionEntrega').value.trim();
            const ciudad = document.getElementById('nuevaCiudadEntrega').value.trim();
            const nombreProducto = document.getElementById('nuevoNombreProducto').value.trim();
            const monto = parseFloat(document.getElementById('nuevoMontoTotal').value) || 0;
            const metodoPago = document.getElementById('nuevoMetodoPago').value;
            const estadoInicial = document.getElementById('nuevoEstadoPedido').value;

            // Obtener primer producto disponible para asociar
            let idProducto = 1;
            try {
                const prods = await API.getProductos();
                if (prods && prods.length > 0) idProducto = prods[0].id_producto;
            } catch (_) {}

            const nuevoPedidoData = {
                documento_identidad: `NIT-${Date.now().toString().slice(-8)}`,
                direccion_entrega: `${direccion}, ${ciudad}`,
                metodo_pago: metodoPago,
                observaciones: `Pedido Admin | Empresa: ${nombreEmpresa} | Contacto: ${responsable} | Ref: ${nombreProducto}`,
                items: [{
                    id_producto: idProducto,
                    cantidad: 1,
                    precio_unitario: monto
                }]
            };

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando en BD...';

                const res = await API.crearPedido(nuevoPedidoData);

                // Si se especificó estado diferente a pendiente, actualizarlo
                if (estadoInicial && estadoInicial !== 'pendiente') {
                    await API.actualizarEstadoPedido(res.id_pedido, estadoInicial);
                }

                alert(`¡Pedido #ORD-${res.id_pedido} registrado exitosamente en la base de datos MySQL!`);
                modalNuevoPedido.classList.remove('activo');
                formularioNuevoPedido.reset();
                await cargarPedidosDesdeBD();
            } catch (err) {
                alert('Error al registrar pedido en la base de datos: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    // --- EXPORTAR A CSV ---
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            if (datosPedidos.length === 0) {
                alert('No hay pedidos para exportar.');
                return;
            }
            let csv = 'ID_Pedido,Cliente,Contacto,Direccion,Ciudad,Total,Estado,Fecha\n';
            datosPedidos.forEach(p => {
                csv += `"${p.id}","${p.cliente}","${p.contacto}","${p.direccion}","${p.ciudad}",${p.total},"${p.estado}","${p.fecha}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pedidos_baraton_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        });
    }

    // Carga inicial
    await cargarPedidosDesdeBD();
});
