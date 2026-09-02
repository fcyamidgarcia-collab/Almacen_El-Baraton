/**
 * Página de Pago / Checkout - Conectado a MySQL
 * Crea pedido transaccional y vacía el carrito tras el pago
 */

document.addEventListener('DOMContentLoaded', async () => {

    const user = API.getUsuarioActual();

    // Si no hay sesión, redirigir al login
    if (!user) {
        alert('Debes iniciar sesión para proceder al pago.');
        window.location.href = '../sesion/index.html';
        return;
    }

    function fmt(v) { return '$ ' + Number(v || 0).toLocaleString('es-CO'); }

    // ---- Precargar datos del usuario en el formulario ----
    const campos = {
        nombre: document.getElementById('nombre'),
        email: document.getElementById('email'),
        documento: document.getElementById('documento'),
        telefono: document.getElementById('telefono'),
        direccion: document.getElementById('direccion'),
        ciudad: document.getElementById('ciudad')
    };

    if (campos.nombre) campos.nombre.value = user.nombre || '';
    if (campos.email) campos.email.value = user.email || user.correo || '';

    // Intentar cargar datos adicionales del cliente
    try {
        const clienteData = await API.getClientePorUsuario(user.id_usuario);
        if (clienteData) {
            if (campos.documento && clienteData.documento_identidad) campos.documento.value = clienteData.documento_identidad;
            if (campos.telefono && clienteData.telefono) campos.telefono.value = clienteData.telefono;
            if (campos.direccion && clienteData.direccion) campos.direccion.value = clienteData.direccion;
            if (campos.ciudad && clienteData.ciudad) campos.ciudad.value = clienteData.ciudad;
        }
    } catch (e) { console.warn('No se pudieron cargar datos del cliente:', e.message); }

    // ---- Cargar resumen del carrito ----
    let carritoData = null;
    let itemsParaPedido = [];

    try {
        // Primero intentar desde localStorage (guardado por carrito.js)
        const cached = localStorage.getItem('carrito_checkout');
        if (cached) {
            carritoData = JSON.parse(cached);
        } else {
            carritoData = await API.getCarrito();
        }

        if (!carritoData || !carritoData.items || carritoData.items.length === 0) {
            alert('Tu carrito está vacío. Agrega productos antes de pagar.');
            window.location.href = '../productos/productos.html';
            return;
        }

        itemsParaPedido = carritoData.items;

        // Mostrar resumen en la página de pago
        const subtotalElem = document.getElementById('resumen-subtotal');
        const ivaElem = document.getElementById('resumen-iva');
        const totalElem = document.querySelector('.total-valor');
        const itemsListEl = document.getElementById('resumen-items');

        if (subtotalElem) subtotalElem.textContent = fmt(carritoData.subtotal);
        if (ivaElem) ivaElem.textContent = fmt(carritoData.iva);
        if (totalElem) totalElem.textContent = fmt(carritoData.total);

        // Lista de productos en el resumen
        if (itemsListEl) {
            itemsListEl.innerHTML = carritoData.items.map(i => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:0.88rem">
                    <span style="flex:1">${i.nombre} <span style="color:#94a3b8">x${i.cantidad}</span></span>
                    <span style="font-weight:600">${fmt(i.subtotal)}</span>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error('Error cargando carrito para checkout:', e.message);
    }

    // ---- Selección de método de pago ----
    let metodoPago = 'Contraentrega';
    const radiosPago = document.querySelectorAll('input[name="metodo_pago"]');
    const panelTransferencia = document.getElementById('panel-transferencia');
    const panelBilletera = document.getElementById('panel-billetera');

    radiosPago.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.opcion-pago').forEach(lbl => lbl.classList.remove('activa'));
            e.target.closest('.opcion-pago')?.classList.add('activa');
            if (panelTransferencia) panelTransferencia.classList.add('oculto');
            if (panelBilletera) panelBilletera.classList.add('oculto');

            if (e.target.value === 'transferencia') {
                metodoPago = 'Transferencia Bancaria';
                panelTransferencia?.classList.remove('oculto');
            } else if (e.target.value === 'billetera') {
                metodoPago = 'Nequi / Daviplata';
                panelBilletera?.classList.remove('oculto');
            } else if (e.target.value === 'tarjeta') {
                metodoPago = 'Tarjeta de Crédito / Débito';
            } else {
                metodoPago = e.target.value || 'Contraentrega';
            }
        });
    });

    // ---- Procesar Pedido ----
    const btnCheckout = document.getElementById('btn-procesar-checkout');
    if (!btnCheckout) return;

    btnCheckout.addEventListener('click', async (e) => {
        e.preventDefault();

        const nombre = campos.nombre?.value.trim();
        const email = campos.email?.value.trim();
        const telefono = campos.telefono?.value.trim() || '';
        const direccion = campos.direccion?.value.trim();
        const ciudad = campos.ciudad?.value.trim() || 'Bogotá D.C.';

        // Validaciones básicas
        if (!nombre || !email || !direccion) {
            alert('Por favor completa los campos: Nombre, Correo y Dirección de entrega.');
            return;
        }

        if (itemsParaPedido.length === 0) {
            alert('No hay productos en el carrito.');
            return;
        }

        btnCheckout.disabled = true;
        btnCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando pedido...';

        try {
            // Obtener o crear el cliente asociado al usuario
            let id_cliente = null;
            try {
                const cli = await API.getClientePorUsuario(user.id_usuario);
                id_cliente = cli?.id_cliente || null;
            } catch (_) {}

            // Construir items del pedido
            const items = itemsParaPedido.map(i => ({
                id_producto: i.id_producto,
                cantidad: i.cantidad,
                precio_unitario: i.precio_unitario || i.precio
            }));

            const documento = campos.documento?.value.trim() || '';

            const datosPedido = {
                id_usuario: user.id_usuario,
                id_cliente,
                documento_identidad: documento || null,
                items,
                direccion_entrega: `${direccion}, ${ciudad}`,
                metodo_pago: metodoPago,
                observaciones: `Pedido web | Cliente: ${nombre} | Tel: ${telefono}`
            };

            const resultado = await API.crearPedido(datosPedido);

            // Vaciar carrito en BD
            if (carritoData?.id_carrito) {
                try { await API.vaciarCarrito(carritoData.id_carrito); } catch (_) {}
            }

            // Limpiar cache local
            localStorage.removeItem('carrito_checkout');

            // Redirigir a confirmación
            const numPedido = resultado.id_pedido || resultado.codigo_pedido || 'N/A';
            window.location.href = `../confirmacion/confirmacion.html?pedido=${numPedido}&total=${carritoData?.total || 0}&metodo=${encodeURIComponent(metodoPago)}`;

        } catch (err) {
            alert('Error al procesar el pedido: ' + err.message);
            btnCheckout.disabled = false;
            btnCheckout.innerHTML = '<i class="fas fa-lock"></i> Confirmar y Pagar';
        }
    });
});
