/**
 * Lógica para la página de Checkout - Conectado a MySQL
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Lógica del Header Scroll ---
    const nav = document.getElementById('barraNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- Cargar datos del Carrito y Usuario ---
    let itemsParaPedido = [];
    const user = API.getUsuarioActual();

    // Precargar datos del usuario si está logueado
    if (user) {
        const inputNombre = document.getElementById('nombre');
        const inputEmail = document.getElementById('email');
        const inputTelefono = document.getElementById('telefono');
        const inputDireccion = document.getElementById('direccion');
        const inputCiudad = document.getElementById('ciudad');

        if (inputNombre && user.nombre) inputNombre.value = user.nombre;
        if (inputEmail && user.email) inputEmail.value = user.email;
        if (inputTelefono && user.telefono) inputTelefono.value = user.telefono;
        if (inputDireccion && user.direccion) inputDireccion.value = user.direccion;
        if (inputCiudad && user.ciudad) inputCiudad.value = user.ciudad;
    }

    try {
        const carrito = await API.getCarrito();
        if (carrito.items && carrito.items.length > 0) {
            itemsParaPedido = carrito.items;
            
            const subtotalElem = document.querySelector('.desglose-fila:nth-child(1) span:last-child');
            const ivaElem = document.querySelector('.desglose-fila:nth-child(3) span:last-child');
            const totalElem = document.querySelector('.total-valor');

            if (subtotalElem) subtotalElem.textContent = '$ ' + Number(carrito.subtotal).toLocaleString('es-CO');
            if (ivaElem) ivaElem.textContent = '$ ' + Number(carrito.iva).toLocaleString('es-CO');
            if (totalElem) totalElem.textContent = '$ ' + Number(carrito.total).toLocaleString('es-CO');
        }
    } catch (e) {
        console.warn('No se pudo cargar el carrito para checkout:', e.message);
    }

    // --- Lógica de Métodos de Pago ---
    const radiosPago = document.querySelectorAll('input[name="metodo_pago"]');
    const panelTransferencia = document.getElementById('panel-transferencia');
    const panelBilletera = document.getElementById('panel-billetera');
    let metodoPagoSeleccionado = 'Transferencia Bancaria';
    
    radiosPago.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.opcion-pago').forEach(lbl => lbl.classList.remove('activa'));
            e.target.closest('.opcion-pago').classList.add('activa');
            
            if (panelTransferencia) panelTransferencia.classList.add('oculto');
            if (panelBilletera) panelBilletera.classList.add('oculto');

            if (e.target.value === 'transferencia') {
                metodoPagoSeleccionado = 'Transferencia Bancaria';
                if (panelTransferencia) panelTransferencia.classList.remove('oculto');
            } else if (e.target.value === 'billetera') {
                metodoPagoSeleccionado = 'Billetera Digital (Nequi / Daviplata)';
                if (panelBilletera) panelBilletera.classList.remove('oculto');
            } else {
                metodoPagoSeleccionado = 'Tarjeta de Crédito / Débito';
            }
        });
    });

    // --- Procesar Checkout y Guardar en MySQL ---
    const btnCheckout = document.getElementById('btn-procesar-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre')?.value || user?.nombre || 'Cliente Web';
            const email = document.getElementById('email')?.value || user?.email || 'cliente@ejemplo.com';
            const telefono = document.getElementById('telefono')?.value || user?.telefono || '';
            const direccion = document.getElementById('direccion')?.value || user?.direccion || 'Calle 100 # 15-20';
            const ciudad = document.getElementById('ciudad')?.value || user?.ciudad || 'Bogotá D.C.';

            // Si no hay items en el carrito activo, usar producto por defecto
            const items = (itemsParaPedido && itemsParaPedido.length > 0) 
                ? itemsParaPedido.map(i => ({ id_producto: i.id_producto, sku: i.sku, cantidad: i.cantidad, precio: i.precio }))
                : [{ sku: 'IND-8821', cantidad: 1, precio: 650000 }];

            const datosPedido = {
                id_usuario: user?.id_usuario || null,
                id_cliente: user?.cliente?.id_cliente || null,
                nombre_cliente: nombre,
                email_cliente: email,
                telefono_cliente: telefono,
                direccion_envio: direccion,
                ciudad_envio: ciudad,
                metodo_pago: metodoPagoSeleccionado,
                items
            };

            try {
                btnCheckout.disabled = true;
                btnCheckout.textContent = 'Procesando con la base de datos...';

                const resultado = await API.crearPedido(datosPedido);

                alert(`¡Pago y Pedido registrado con éxito en MySQL!\nCódigo de Pedido: ${resultado.codigo_pedido}\nFactura: ${resultado.numero_factura}`);
                window.location.href = `../confirmacion/confirmacion.html?pedido=${resultado.codigo_pedido}`;
            } catch (err) {
                alert('Error al procesar el pago: ' + err.message);
                btnCheckout.disabled = false;
                btnCheckout.textContent = 'Confirmar y Pagar';
            }
        });
    }
});
