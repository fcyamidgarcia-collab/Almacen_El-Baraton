// =======================================================
// GESTIÓN DE PEDIDOS - CONECTADO A MYSQL
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {
    let datosPedidos = [];
    let estadoFiltroActual = 'all';
    let terminoBusquedaActual = '';
    let paginaActual = 1;
    const itemsPorPagina = 7;
    let pedidoSeleccionadoActual = null;

    const cuerpoTablaPedidos = document.getElementById('cuerpoTablaPedidos');
    const estadoVacio = document.getElementById('estadoVacio');
    const pestanasEstado = document.querySelectorAll('.boton-pestana');
    const selectFiltroEstado = document.getElementById('selectFiltroEstado');
    const busquedaPedidoInput = document.getElementById('busquedaPedidoInput');
    
    const kpiTotalVentas = document.getElementById('kpiTotalVentas');
    const kpiConteoPedidos = document.getElementById('kpiConteoPedidos');
    const kpiTextoPendientes = document.getElementById('kpiTextoPendientes');
    const insigniaPedidosBarra = document.getElementById('insigniaPedidosBarra');
    const subtituloSeccionPrincipal = document.getElementById('subtituloSeccionPrincipal');
    const conteoTodos = document.getElementById('conteoTodos');
    const conteoPendiente = document.getElementById('conteoPendiente');
    const conteoProcesando = document.getElementById('conteoProcesando');
    const conteoEnviado = document.getElementById('conteoEnviado');
    const conteoEntregado = document.getElementById('conteoEntregado');

    const infoPaginacion = document.getElementById('infoPaginacion');
    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');
    const contenedorNumerosPagina = document.getElementById('contenedorNumerosPagina');

    const modalDetallePedido = document.getElementById('modalDetallePedido');
    const btnCerrarModalDetalle = document.getElementById('btnCerrarModalDetalle');
    const btnCerrarModalDetallePie = document.getElementById('btnCerrarModalDetallePie');
    const modalNuevoPedido = document.getElementById('modalNuevoPedido');
    const btnNuevoPedido = document.getElementById('btnNuevoPedido');
    const btnCerrarModalNuevoPedido = document.getElementById('btnCerrarModalNuevoPedido');
    const btnCancelarNuevoPedido = document.getElementById('btnCancelarNuevoPedido');
    const formularioNuevoPedido = document.getElementById('formularioNuevoPedido');

    function formatearMoneda(monto) {
        return '$ ' + Number(monto || 0).toLocaleString('es-CO');
    }

    async function cargarPedidosDesdeBD() {
        try {
            cuerpoTablaPedidos.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos desde la base de datos...</td></tr>`;
            datosPedidos = await API.getPedidos();
            renderizarTabla();
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            cuerpoTablaPedidos.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Error al conectar con la base de datos (${error.message}).</td></tr>`;
        }
    }

    function actualizarKPIs() {
        const totalVentas = datosPedidos.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
        const totalPedidos = datosPedidos.length;
        const pendientes = datosPedidos.filter(o => o.estado === 'pendiente').length;
        const procesando = datosPedidos.filter(o => o.estado === 'procesando').length;
        const enviados = datosPedidos.filter(o => o.estado === 'enviado').length;
        const entregados = datosPedidos.filter(o => o.estado === 'entregado' || o.estado === 'completado').length;

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

    function obtenerInsigniaEstado(estado) {
        const estadoNorm = (estado || 'pendiente').toLowerCase();
        const mapa = {
            'pendiente': { etiqueta: '● pendiente', clase: 'estado-pendiente' },
            'procesando': { etiqueta: '● procesando', clase: 'estado-procesando' },
            'enviado': { etiqueta: '● enviado', clase: 'estado-enviado' },
            'entregado': { etiqueta: '● entregado', clase: 'estado-entregado' },
            'completado': { etiqueta: '● completado', clase: 'estado-entregado' },
            'cancelado': { etiqueta: '● cancelado', clase: 'estado-cancelado' }
        };
        const s = mapa[estadoNorm] || { etiqueta: `● ${estado}`, clase: 'estado-pendiente' };
        return `<span class="estado ${s.clase}">${s.etiqueta}</span>`;
    }

    function obtenerPedidosFiltrados() {
        return datosPedidos.filter(pedido => {
            const estadoPedido = (pedido.estado || '').toLowerCase();
            const coincideEstado = (estadoFiltroActual === 'all') || (estadoPedido === estadoFiltroActual.toLowerCase());
            const term = terminoBusquedaActual.toLowerCase();
            const coincideBusqueda = !term || 
                (pedido.id && pedido.id.toLowerCase().includes(term)) ||
                (pedido.cliente && pedido.cliente.toLowerCase().includes(term)) ||
                (pedido.contacto && pedido.contacto.toLowerCase().includes(term)) ||
                (pedido.ciudad && pedido.ciudad.toLowerCase().includes(term));

            return coincideEstado && coincideBusqueda;
        });
    }

    function renderizarTabla() {
        const filtrados = obtenerPedidosFiltrados();
        const totalItems = filtrados.length;
        const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;

        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const corteActual = filtrados.slice(inicio, fin);

        cuerpoTablaPedidos.innerHTML = '';

        if (corteActual.length === 0) {
            if (estadoVacio) estadoVacio.style.display = 'block';
            document.getElementById('tablaPedidos').style.display = 'none';
        } else {
            if (estadoVacio) estadoVacio.style.display = 'none';
            document.getElementById('tablaPedidos').style.display = 'table';

            corteActual.forEach(pedido => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="checkbox-pedido" data-id="${pedido.id}"></td>
                    <td><span class="celda-id-pedido" style="cursor: pointer; font-weight: 600; color: #2563eb;" data-id="${pedido.id}">${pedido.id}</span></td>
                    <td>
                        <div class="celda-cliente">
                            <span class="nombre-cliente">${pedido.cliente}</span>
                            <span class="subtexto-cliente">${pedido.contacto || ''} • ${pedido.ciudad}</span>
                        </div>
                    </td>
                    <td><span class="celda-total">${formatearMoneda(pedido.total)}</span></td>
                    <td>${obtenerInsigniaEstado(pedido.estado)}</td>
                    <td><span class="celda-fecha">${pedido.fecha}</span></td>
                    <td style="text-align: center;">
                        <div class="acciones-tabla">
                            <button class="boton-accion btn-ver-pedido" data-id="${pedido.id}" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                `;
                cuerpoTablaPedidos.appendChild(tr);
            });
        }

        document.querySelectorAll('.btn-ver-pedido, .celda-id-pedido').forEach(elem => {
            elem.addEventListener('click', () => {
                const id = elem.getAttribute('data-id');
                abrirModalDetalle(id);
            });
        });

        actualizarPaginacion(totalItems, totalPaginas);
        actualizarKPIs();
    }

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
        infoPaginacion.textContent = `Mostrando ${inicio}-${fin} de ${totalItems} pedidos`;
    }

    function abrirModalDetalle(id) {
        const p = datosPedidos.find(o => o.id === id);
        if (!p) return;
        pedidoSeleccionadoActual = p;

        document.getElementById('modalIdPedido').textContent = p.id;
        document.getElementById('modalEstadoPedido').innerHTML = obtenerInsigniaEstado(p.estado);
        document.getElementById('modalNombreCliente').textContent = p.cliente;
        document.getElementById('modalDocCliente').textContent = `NIT: ${p.nit || 'N/A'}`;
        document.getElementById('modalNombreContacto').textContent = p.contacto;
        document.getElementById('modalEmailContacto').textContent = p.email;
        document.getElementById('modalDireccionEntrega').textContent = p.direccion;
        document.getElementById('modalCiudadEntrega').textContent = `${p.ciudad}, Colombia`;
        document.getElementById('modalMetodoPago').textContent = p.metodoPago;
        document.getElementById('modalFechaPedido').textContent = p.fecha;

        const cuerpoModalItems = document.getElementById('cuerpoTablaModalItems');
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
        }

        const impuesto = p.total - subtotal;
        document.getElementById('modalSubtotal').textContent = formatearMoneda(subtotal || p.subtotal);
        document.getElementById('modalImpuesto').textContent = formatearMoneda(impuesto || p.iva);
        document.getElementById('modalTotal').textContent = formatearMoneda(p.total);
        document.getElementById('selectModalEstado').value = (p.estado || 'pendiente').toLowerCase();

        modalDetallePedido.classList.add('activo');
    }

    const btnActualizarEstado = document.getElementById('btnActualizarEstadoModal');
    if (btnActualizarEstado) {
        btnActualizarEstado.addEventListener('click', async () => {
            if (!pedidoSeleccionadoActual) return;
            const nuevoEstado = document.getElementById('selectModalEstado').value;
            try {
                await API.cambiarEstadoPedido(pedidoSeleccionadoActual.id, nuevoEstado);
                alert(`Estado del pedido ${pedidoSeleccionadoActual.id} actualizado a '${nuevoEstado}' en MySQL.`);
                modalDetallePedido.classList.remove('activo');
                await cargarPedidosDesdeBD();
            } catch (err) {
                alert('Error al actualizar estado: ' + err.message);
            }
        });
    }

    pestanasEstado.forEach(tab => {
        tab.addEventListener('click', function() {
            pestanasEstado.forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            estadoFiltroActual = this.getAttribute('data-estado');
            paginaActual = 1;
            renderizarTabla();
        });
    });

    if (busquedaPedidoInput) {
        busquedaPedidoInput.addEventListener('input', function() {
            terminoBusquedaActual = this.value.trim().toLowerCase();
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (selectFiltroEstado) {
        selectFiltroEstado.addEventListener('change', function() {
            estadoFiltroActual = this.value;
            paginaActual = 1;
            renderizarTabla();
        });
    }

    if (btnCerrarModalDetalle) btnCerrarModalDetalle.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));
    if (btnCerrarModalDetallePie) btnCerrarModalDetallePie.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));
    if (btnNuevoPedido) btnNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.add('activo'));
    if (btnCerrarModalNuevoPedido) btnCerrarModalNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));
    if (btnCancelarNuevoPedido) btnCancelarNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));

    if (formularioNuevoPedido) {
        formularioNuevoPedido.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nuevoP = {
                nombre_cliente: document.getElementById('nuevoNombreCliente').value.trim(),
                email_cliente: document.getElementById('nuevoEmailContacto').value.trim(),
                telefono_cliente: '300 000 0000',
                direccion_envio: document.getElementById('nuevaDireccionEntrega').value.trim(),
                ciudad_envio: document.getElementById('nuevaCiudadEntrega').value.trim(),
                metodo_pago: document.getElementById('nuevoMetodoPago').value,
                items: [{
                    sku: 'IND-8821', // Referencia a producto existente en BD
                    cantidad: 1,
                    precio: parseFloat(document.getElementById('nuevoMontoTotal').value)
                }]
            };

            try {
                const res = await API.crearPedido(nuevoP);
                alert(`¡Pedido ${res.codigo_pedido} registrado exitosamente en la base de datos MySQL!`);
                modalNuevoPedido.classList.remove('activo');
                formularioNuevoPedido.reset();
                await cargarPedidosDesdeBD();
            } catch (err) {
                alert('Error al registrar pedido: ' + err.message);
            }
        });
    }

    await cargarPedidosDesdeBD();
});
