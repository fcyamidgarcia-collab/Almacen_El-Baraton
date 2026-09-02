// =======================================================
// GESTIÓN DE PEDIDOS - INDUSTRIAL SUPPLY CO. (ESPAÑOL)
// =======================================================

document.addEventListener('DOMContentLoaded', () => {

    let datosPedidos = [
        {
            id: '#ORD-336923',
            cliente: 'Constructora Andina S.A.',
            nit: '900.824.119-3',
            contacto: 'Ing. Carlos Morales',
            email: 'cmorales@andina.com.co',
            direccion: 'Parque Industrial Módulo 4',
            ciudad: 'Bogotá D.C.',
            total: 12657900,
            estado: 'pendiente',
            fecha: '31 de agosto de 2026 a las 04:27 p. m.',
            rawFecha: '2026-08-31T16:27:00',
            metodoPago: 'Crédito Corporativo (30 días)',
            items: [
                { sku: 'IND-8821', nombre: 'Taladro Percutor Industrial 1200W', cantidad: 10, precio: 650000 },
                { sku: 'IND-4309', nombre: 'Kit de Eslingas de Carga Pesada 5 Ton', cantidad: 15, precio: 210526 },
                { sku: 'IND-1092', nombre: 'Casco de Seguridad Dieléctrico Clase E', cantidad: 50, precio: 60000 }
            ]
        },
        {
            id: '#ORD-20491',
            cliente: 'Industrias Metalmecánicas',
            nit: '860.512.443-1',
            contacto: 'Dra. Elena Gómez',
            email: 'egomez@metalmecanicas.com',
            direccion: 'Zona Industrial Santander Calle 12 #4-50',
            ciudad: 'Bucaramanga',
            total: 4195400,
            estado: 'pendiente',
            fecha: '2026-08-30 15:40',
            rawFecha: '2026-08-30T15:40:00',
            metodoPago: 'Transferencia Bancaria',
            items: [
                { sku: 'MET-772', nombre: 'Soldadora Inverter 250A Uso Continuo', cantidad: 2, precio: 1597700 },
                { sku: 'MET-104', nombre: 'Electrodos E6013 Caja x 20kg', cantidad: 10, precio: 100000 }
            ]
        },
        {
            id: '#ORD-20490',
            cliente: 'Logística del Norte Ltda.',
            nit: '901.229.088-5',
            contacto: 'Rodrigo Pardo',
            email: 'rpardo@logisticanorte.com',
            direccion: 'Terminal de Carga Bodega 8',
            ciudad: 'Barranquilla',
            total: 8139700,
            estado: 'procesando',
            fecha: '2026-08-30 11:15',
            rawFecha: '2026-08-30T11:15:00',
            metodoPago: 'Crédito Corporativo (60 días)',
            items: [
                { sku: 'LOG-991', nombre: 'Transpaleta Hidráulica Manual 3 Ton', cantidad: 4, precio: 1750000 },
                { sku: 'LOG-303', nombre: 'Film Stretch Industrial 500m', cantidad: 24, precio: 47487 }
            ]
        },
        {
            id: '#ORD-20489',
            cliente: 'Acero Corp.',
            nit: '800.198.332-9',
            contacto: 'Ing. Mateo Restrepo',
            email: 'mrestrepo@acerocorp.com.co',
            direccion: 'Complejo Siderúrgico Km 8',
            ciudad: 'Medellín',
            total: 1959800,
            estado: 'enviado',
            fecha: '2026-08-29 18:22',
            rawFecha: '2026-08-29T18:22:00',
            metodoPago: 'Tarjeta de Crédito Empresarial',
            items: [
                { sku: 'ACE-551', nombre: 'Disco de Corte Diamantado 9"', cantidad: 40, precio: 48995 }
            ]
        },
        {
            id: '#ORD-20487',
            cliente: 'Mantenimiento Integral',
            nit: '900.441.772-0',
            contacto: 'Felipe Vargas',
            email: 'fvargas@mantintegral.com',
            direccion: 'Carrera 68D # 19-40',
            ciudad: 'Bogotá D.C.',
            total: 3509700,
            estado: 'pendiente',
            fecha: '2026-08-28 20:10',
            rawFecha: '2026-08-28T20:10:00',
            metodoPago: 'Transferencia Bancaria',
            items: [
                { sku: 'MNT-310', nombre: 'Compresor de Aire 50L 2.5HP', cantidad: 3, precio: 950000 },
                { sku: 'MNT-112', nombre: 'Set Llaves de Impacto Neumáticas', cantidad: 2, precio: 329850 }
            ]
        }
    ];

    let estadoFiltroActual = 'all';
    let terminoBusquedaActual = '';
    let ordenActual = 'date-desc';
    let paginaActual = 1;
    const itemsPorPagina = 7;
    let pedidoSeleccionadoActual = null;

    const cuerpoTablaPedidos = document.getElementById('cuerpoTablaPedidos');
    const estadoVacio = document.getElementById('estadoVacio');
    const pestanasEstado = document.querySelectorAll('.boton-pestana');
    const selectFiltroEstado = document.getElementById('selectFiltroEstado');
    const selectOrdenamiento = document.getElementById('selectOrdenamiento');
    const busquedaPedidoInput = document.getElementById('busquedaPedidoInput');
    const checkboxSeleccionarTodos = document.getElementById('checkboxSeleccionarTodos');
    
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
    const btnExportar = document.getElementById('btnExportar');
    const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

    function formatearMoneda(monto) {
        return '$ ' + Number(monto).toLocaleString('es-CO');
    }

    function actualizarKPIs() {
        const totalVentas = datosPedidos.reduce((acc, curr) => acc + curr.total, 0);
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

    function obtenerInsigniaEstado(estado) {
        const mapa = {
            'pendiente': { etiqueta: '● pendiente', clase: 'estado-pendiente' },
            'procesando': { etiqueta: '● procesando', clase: 'estado-procesando' },
            'enviado': { etiqueta: '● enviado', clase: 'estado-enviado' },
            'entregado': { etiqueta: '● entregado', clase: 'estado-entregado' },
            'cancelado': { etiqueta: '● cancelado', clase: 'estado-cancelado' }
        };
        const s = mapa[estado.toLowerCase()] || { etiqueta: `● ${estado}`, clase: 'estado-pendiente' };
        return `<span class="estado ${s.clase}">${s.etiqueta}</span>`;
    }

    function obtenerPedidosFiltrados() {
        return datosPedidos.filter(pedido => {
            const coincideEstado = (estadoFiltroActual === 'all') || (pedido.estado.toLowerCase() === estadoFiltroActual.toLowerCase());
            const term = terminoBusquedaActual.toLowerCase();
            const coincideBusqueda = !term || 
                pedido.id.toLowerCase().includes(term) ||
                pedido.cliente.toLowerCase().includes(term) ||
                pedido.contacto.toLowerCase().includes(term) ||
                pedido.ciudad.toLowerCase().includes(term);

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
            estadoVacio.style.display = 'block';
            document.getElementById('tablaPedidos').style.display = 'none';
        } else {
            estadoVacio.style.display = 'none';
            document.getElementById('tablaPedidos').style.display = 'table';

            corteActual.forEach(pedido => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="checkbox-pedido" data-id="${pedido.id}"></td>
                    <td><span class="celda-id-pedido" data-id="${pedido.id}">${pedido.id}</span></td>
                    <td>
                        <div class="celda-cliente">
                            <span class="nombre-cliente">${pedido.cliente}</span>
                            <span class="subtexto-cliente">${pedido.contacto} • ${pedido.ciudad}</span>
                        </div>
                    </td>
                    <td><span class="celda-total">${formatearMoneda(pedido.total)}</span></td>
                    <td>${obtenerInsigniaEstado(pedido.estado)}</td>
                    <td><span class="celda-fecha">${pedido.fecha}</span></td>
                    <td style="text-align: center;">
                        <div class="acciones-tabla">
                            <button class="boton-accion btn-ver-pedido" data-id="${pedido.id}" title="Ver detalle">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
        if (totalItems === 0) {
            infoPaginacion.textContent = 'Mostrando 0 pedidos';
            btnPaginaAnterior.disabled = true;
            btnPaginaSiguiente.disabled = true;
            contenedorNumerosPagina.innerHTML = '';
            return;
        }

        const inicio = (paginaActual - 1) * itemsPorPagina + 1;
        const fin = Math.min(paginaActual * itemsPorPagina, totalItems);
        infoPaginacion.textContent = `Mostrando ${inicio} - ${fin} de ${totalItems} pedidos`;

        btnPaginaAnterior.disabled = (paginaActual === 1);
        btnPaginaSiguiente.disabled = (paginaActual === totalPaginas);

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

    pestanasEstado.forEach(tab => {
        tab.addEventListener('click', function() {
            pestanasEstado.forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            estadoFiltroActual = this.getAttribute('data-status');
            selectFiltroEstado.value = estadoFiltroActual;
            paginaActual = 1;
            renderizarTabla();
        });
    });

    selectFiltroEstado.addEventListener('change', function() {
        estadoFiltroActual = this.value;
        paginaActual = 1;
        renderizarTabla();
    });

    busquedaPedidoInput.addEventListener('input', function() {
        terminoBusquedaActual = this.value.trim();
        paginaActual = 1;
        renderizarTabla();
    });

    function abrirModalDetalle(id) {
        const p = datosPedidos.find(o => o.id === id);
        if (!p) return;
        pedidoSeleccionadoActual = p;

        document.getElementById('modalIdPedido').textContent = p.id;
        document.getElementById('modalEstadoPedido').outerHTML = `<span id="modalEstadoPedido">${obtenerInsigniaEstado(p.estado)}</span>`;
        document.getElementById('modalNombreCliente').textContent = p.cliente;
        document.getElementById('modalDocCliente').textContent = `NIT: ${p.nit}`;
        document.getElementById('modalNombreContacto').textContent = p.contacto;
        document.getElementById('modalEmailContacto').textContent = p.email;
        document.getElementById('modalDireccionEntrega').textContent = p.direccion;
        document.getElementById('modalCiudadEntrega').textContent = `${p.ciudad}, Colombia`;
        document.getElementById('modalMetodoPago').textContent = p.metodoPago;
        document.getElementById('modalFechaPedido').textContent = p.fecha;

        const cuerpoModalItems = document.getElementById('cuerpoTablaModalItems');
        cuerpoModalItems.innerHTML = '';
        let subtotal = 0;
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

        const impuesto = p.total - subtotal;
        document.getElementById('modalSubtotal').textContent = formatearMoneda(subtotal);
        document.getElementById('modalImpuesto').textContent = formatearMoneda(impuesto);
        document.getElementById('modalTotal').textContent = formatearMoneda(p.total);
        document.getElementById('selectModalEstado').value = p.estado;

        modalDetallePedido.classList.add('activo');
    }

    document.getElementById('btnActualizarEstadoModal').addEventListener('click', () => {
        if (!pedidoSeleccionadoActual) return;
        const nuevoEstado = document.getElementById('selectModalEstado').value;
        pedidoSeleccionadoActual.estado = nuevoEstado;
        renderizarTabla();
        modalDetallePedido.classList.remove('activo');
    });

    btnCerrarModalDetalle.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));
    btnCerrarModalDetallePie.addEventListener('click', () => modalDetallePedido.classList.remove('activo'));
    btnNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.add('activo'));
    btnCerrarModalNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));
    btnCancelarNuevoPedido.addEventListener('click', () => modalNuevoPedido.classList.remove('activo'));

    formularioNuevoPedido.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoP = {
            id: `#ORD-${Math.floor(100000 + Math.random() * 900000)}`,
            cliente: document.getElementById('nuevoNombreCliente').value.trim(),
            nit: '901.554.210-9',
            contacto: document.getElementById('nuevoNombreContacto').value.trim(),
            email: document.getElementById('nuevoEmailContacto').value.trim(),
            direccion: document.getElementById('nuevaDireccionEntrega').value.trim(),
            ciudad: document.getElementById('nuevaCiudadEntrega').value.trim(),
            total: parseFloat(document.getElementById('nuevoMontoTotal').value),
            estado: document.getElementById('nuevoEstadoPedido').value,
            fecha: 'Justo ahora',
            metodoPago: document.getElementById('nuevoMetodoPago').value,
            items: [{ sku: 'IND-NEW', nombre: document.getElementById('nuevoNombreProducto').value.trim(), cantidad: 1, precio: parseFloat(document.getElementById('nuevoMontoTotal').value) }]
        };
        datosPedidos.unshift(nuevoP);
        modalNuevoPedido.classList.remove('activo');
        renderizarTabla();
    });

    renderizarTabla();
});
