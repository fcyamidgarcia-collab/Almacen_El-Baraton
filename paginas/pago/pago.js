/**
 * Página de Pago / Checkout - Conectado a MySQL (VALIDACIONES INTEGRADAS)
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
        tipo_documento: document.getElementById('tipo_documento'),
        documento: document.getElementById('documento'),
        telefono: document.getElementById('telefono'),
        direccion: document.getElementById('direccion'),
        ciudad: document.getElementById('ciudad')
    };

    // --- Funciones de error visual directo en checkout ---
    function mostrarErrorCheckout(input, mensaje) {
        limpiarErrorCheckout(input);
        const grupo = input.closest('.grupo-input') || input.parentElement;
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';

        const span = document.createElement('span');
        span.className = 'error-checkout-msg';
        span.style.cssText = 'color: #ef4444; font-size: 0.78rem; margin-top: 4px; display: flex; align-items: center; gap: 4px; font-weight: 500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        grupo.appendChild(span);
    }

    function limpiarErrorCheckout(input) {
        const grupo = input.closest('.grupo-input') || input.parentElement;
        input.style.borderColor = '';
        input.style.boxShadow = '';
        const msg = grupo.querySelector('.error-checkout-msg');
        if (msg) msg.remove();
    }

    Object.values(campos).forEach(campo => {
        if (campo) {
            campo.addEventListener('input', () => limpiarErrorCheckout(campo));
        }
    });

    if (campos.nombre) campos.nombre.value = user.nombre || '';
    if (campos.email) campos.email.value = user.email || user.correo || '';

    // Intentar cargar datos adicionales del cliente
    try {
        const clienteData = await API.getClientePorUsuario(user.id_usuario);
        if (clienteData) {
            let rawDoc = clienteData.documento_identidad || '';
            let tipoDoc = clienteData.tipo_documento || 'CC';
            let numDoc = rawDoc;
            if (rawDoc && rawDoc.includes(':')) {
                const p = rawDoc.split(':');
                tipoDoc = p[0].trim().toUpperCase();
                numDoc = p.slice(1).join(':').trim();
            }
            if (campos.tipo_documento) campos.tipo_documento.value = tipoDoc;
            if (campos.documento) campos.documento.value = numDoc;
            if (campos.telefono && clienteData.telefono) campos.telefono.value = clienteData.telefono;
            if (campos.direccion && clienteData.direccion) campos.direccion.value = clienteData.direccion;
            if (campos.ciudad && clienteData.ciudad) campos.ciudad.value = clienteData.ciudad;
        }
    } catch (e) { console.warn('No se pudieron cargar datos del cliente:', e.message); }

    // ---- Cargar resumen del carrito ----
    let carritoData = null;
    let itemsParaPedido = [];

    try {
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

        const subtotalElem = document.getElementById('resumen-subtotal');
        const ivaElem = document.getElementById('resumen-iva');
        const totalElem = document.querySelector('.total-valor');
        const itemsListEl = document.getElementById('resumen-items');

        if (subtotalElem) subtotalElem.textContent = fmt(carritoData.subtotal);
        if (ivaElem) ivaElem.textContent = fmt(carritoData.iva);
        if (totalElem) totalElem.textContent = fmt(carritoData.total);

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

    // ---- Manejo de archivos de comprobante ----
    const fileComprobante = document.getElementById('comprobante');
    const labelNombreArchivo = document.getElementById('nombre-archivo');
    const fileBilletera = document.getElementById('comprobante-billetera');
    const labelNombreBilletera = document.getElementById('nombre-archivo-billetera');

    if (fileComprobante && labelNombreArchivo) {
        fileComprobante.addEventListener('change', () => {
            if (fileComprobante.files.length > 0) {
                labelNombreArchivo.textContent = fileComprobante.files[0].name;
                labelNombreArchivo.style.color = '#10b981';
                limpiarErrorCheckout(fileComprobante);
            } else {
                labelNombreArchivo.textContent = 'No se ha seleccionado ningún archivo.';
                labelNombreArchivo.style.color = '';
            }
        });
    }

    if (fileBilletera && labelNombreBilletera) {
        fileBilletera.addEventListener('change', () => {
            if (fileBilletera.files.length > 0) {
                labelNombreBilletera.textContent = fileBilletera.files[0].name;
                labelNombreBilletera.style.color = '#10b981';
                limpiarErrorCheckout(fileBilletera);
            } else {
                labelNombreBilletera.textContent = 'No se ha seleccionado ningún archivo.';
                labelNombreBilletera.style.color = '';
            }
        });
    }

    // ---- Selección de método de pago ----
    let metodoPago = 'Transferencia Bancaria';
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
                metodoPago = 'Contraentrega';
            }
        });
    });

    // ---- Procesar Pedido y Validaciones Directas ----
    const btnCheckout = document.getElementById('btn-procesar-checkout');
    if (!btnCheckout) return;

    btnCheckout.addEventListener('click', async (e) => {
        e.preventDefault();

        const nombre = campos.nombre?.value.trim() || '';
        const email = campos.email?.value.trim() || '';
        const tipoDoc = campos.tipo_documento?.value || 'CC';
        const documento = campos.documento?.value.trim() || '';
        const telefono = campos.telefono?.value.trim() || '';
        const direccion = campos.direccion?.value.trim() || '';
        const ciudad = campos.ciudad?.value.trim() || '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;

        let esValido = true;

        // 1. Validar Nombre
        if (!nombre) {
            mostrarErrorCheckout(campos.nombre, 'Ingresa tu nombre completo.');
            esValido = false;
        } else if (nombre.length < 3) {
            mostrarErrorCheckout(campos.nombre, 'El nombre debe tener al menos 3 caracteres.');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.nombre);
        }

        // 2. Validar Correo
        if (!email) {
            mostrarErrorCheckout(campos.email, 'Ingresa tu correo electrónico.');
            esValido = false;
        } else if (!emailRegex.test(email)) {
            mostrarErrorCheckout(campos.email, 'Formato de correo no válido.');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.email);
        }

        // 3. Validar Documento
        if (!documento) {
            mostrarErrorCheckout(campos.documento, 'Ingresa tu Documento de Identidad o NIT.');
            esValido = false;
        } else if (documento.length < 5) {
            mostrarErrorCheckout(campos.documento, 'El documento debe tener al menos 5 caracteres.');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.documento);
        }

        // 4. Validar Teléfono
        if (!telefono) {
            mostrarErrorCheckout(campos.telefono, 'Ingresa un teléfono o celular de contacto.');
            esValido = false;
        } else if (!telefonoRegex.test(telefono)) {
            mostrarErrorCheckout(campos.telefono, 'Teléfono inválido (mínimo 7 dígitos).');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.telefono);
        }

        // 5. Validar Dirección
        if (!direccion) {
            mostrarErrorCheckout(campos.direccion, 'Ingresa la dirección completa de entrega.');
            esValido = false;
        } else if (direccion.length < 6) {
            mostrarErrorCheckout(campos.direccion, 'La dirección debe ser detallada (ej. Calle 10 # 20-30).');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.direccion);
        }

        // 6. Validar Ciudad
        if (!ciudad) {
            mostrarErrorCheckout(campos.ciudad, 'Ingresa la ciudad o municipio de entrega.');
            esValido = false;
        } else if (ciudad.length < 3) {
            mostrarErrorCheckout(campos.ciudad, 'Nombre de ciudad inválido.');
            esValido = false;
        } else {
            limpiarErrorCheckout(campos.ciudad);
        }

        // 7. Validar Comprobante de Pago obligatorio según método
        const metodoSeleccionado = document.querySelector('input[name="metodo_pago"]:checked')?.value;
        if (metodoSeleccionado === 'transferencia') {
            if (!fileComprobante || fileComprobante.files.length === 0) {
                mostrarErrorCheckout(fileComprobante, 'Debes adjuntar el comprobante de la transferencia (JPG, PNG o PDF).');
                esValido = false;
            } else {
                limpiarErrorCheckout(fileComprobante);
            }
        } else if (metodoSeleccionado === 'billetera') {
            if (!fileBilletera || fileBilletera.files.length === 0) {
                mostrarErrorCheckout(fileBilletera, 'Debes adjuntar la captura del pago por Nequi/Daviplata.');
                esValido = false;
            } else {
                limpiarErrorCheckout(fileBilletera);
            }
        }

        if (!esValido) {
            const primerError = document.querySelector('.error-checkout-msg');
            if (primerError) {
                primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (itemsParaPedido.length === 0) {
            alert('No hay productos en el carrito.');
            return;
        }

        btnCheckout.disabled = true;
        btnCheckout.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando y confirmando orden...';

        try {
            let id_cliente = null;
            try {
                const cli = await API.getClientePorUsuario(user.id_usuario);
                id_cliente = cli?.id_cliente || null;
            } catch (_) {}

            const items = itemsParaPedido.map(i => ({
                id_producto: i.id_producto,
                cantidad: i.cantidad,
                precio_unitario: i.precio_unitario || i.precio
            }));

            const nombreArchivoComprobante = (metodoSeleccionado === 'transferencia' && fileComprobante?.files[0])
                ? fileComprobante.files[0].name
                : (metodoSeleccionado === 'billetera' && fileBilletera?.files[0] ? fileBilletera.files[0].name : null);

            const datosPedido = {
                id_usuario: user.id_usuario,
                id_cliente,
                tipo_documento: tipoDoc,
                documento_identidad: documento ? `${tipoDoc}: ${documento}` : null,
                numero_documento: documento || null,
                items,
                direccion_entrega: `${direccion}, ${ciudad}`,
                metodo_pago: metodoPago,
                observaciones: `Pedido web | Cliente: ${nombre} | Doc: ${tipoDoc} ${documento} | Tel: ${telefono}${nombreArchivoComprobante ? ` | Comprobante: ${nombreArchivoComprobante}` : ''}`
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
