/**
 * Carrito de Compras - Conectado a MySQL
 * Soporta usuarios logueados (BD) e invitados (localStorage)
 */

document.addEventListener('DOMContentLoaded', async () => {
    const contenedorProductos = document.querySelector('.carrito-productos');
    const filasResumen = document.querySelector('.resumen-filas');
    const totalValor = document.querySelector('.total-valor');
    const btnProceder = document.getElementById('btn-proceder-pago') || document.querySelector('a[href*="pago"]');

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function cabecera() {
        return `
        <div class="productos-cabecera">
            <div class="col-producto">PRODUCTO</div>
            <div class="col-cantidad">CANTIDAD</div>
            <div class="col-precio">PRECIO UNITARIO</div>
            <div class="col-subtotal">SUBTOTAL</div>
            <div></div>
        </div>`;
    }

    function renderResumen(subtotal, iva, total, count) {
        if (filasResumen) {
            filasResumen.innerHTML = `
                <div class="resumen-fila"><span>Subtotal (${count} artículo${count !== 1 ? 's' : ''})</span><span>${fmt(subtotal)}</span></div>
                <div class="resumen-fila"><span>IVA (19%)</span><span>${fmt(iva)}</span></div>
                <div class="resumen-fila"><span>Envío Estimado</span><span class="texto-gratis">Gratis</span></div>
            `;
        }
        if (totalValor) totalValor.textContent = fmt(total);
    }

    function vacio() {
        if (contenedorProductos) {
            contenedorProductos.innerHTML = cabecera() + `
                <div style="padding:60px;text-align:center;color:#64748b">
                    <i class="fas fa-shopping-cart fa-3x" style="color:#cbd5e1;margin-bottom:16px;display:block"></i>
                    <p style="font-size:1.1rem;margin-bottom:12px">Tu carrito está vacío</p>
                    <a href="../productos/productos.html" style="display:inline-block;padding:10px 22px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                        <i class="fas fa-store"></i> Ver Catálogo
                    </a>
                </div>`;
        }
        renderResumen(0, 0, 0, 0);
    }

    // ---- CARRITO PARA USUARIOS LOGUEADOS (desde BD) ----
    async function cargarCarritoDB() {
        const data = await API.getCarrito();

        if (!data.items || data.items.length === 0) { vacio(); return; }

        let html = cabecera();
        data.items.forEach(item => {
            const imgHTML = item.imagen
                ? `<img src="${item.imagen}" alt="${item.nombre}" style="width:56px;height:56px;object-fit:contain;border-radius:6px">`
                : `<div style="width:56px;height:56px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8"><i class="fas fa-box"></i></div>`;

            html += `
            <div class="producto-item" data-id="${item.id_detalle_carrito}">
                <div class="col-producto info-producto">
                    <div class="producto-img">${imgHTML}</div>
                    <div class="producto-detalles">
                        <span class="marca-badge">${item.nombre}</span>
                        <span class="producto-sku">ID: ${item.id_producto}</span>
                    </div>
                </div>
                <div class="col-cantidad">
                    <div class="control-cantidad" style="display:flex;align-items:center;gap:6px">
                        <button class="btn-menos qty-ctrl" data-id="${item.id_detalle_carrito}" data-qty="${item.cantidad}"
                            style="width:28px;height:28px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer;font-size:1rem">-</button>
                        <span class="qty-val" style="min-width:24px;text-align:center;font-weight:600">${item.cantidad}</span>
                        <button class="btn-mas qty-ctrl" data-id="${item.id_detalle_carrito}" data-qty="${item.cantidad}"
                            style="width:28px;height:28px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer;font-size:1rem">+</button>
                    </div>
                </div>
                <div class="col-precio precio-valor">${fmt(item.precio_unitario)}</div>
                <div class="col-subtotal subtotal-valor">${fmt(item.subtotal)}</div>
                <div>
                    <button class="btn-eliminar-item" data-id="${item.id_detalle_carrito}"
                        style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px 8px;border-radius:4px;font-size:0.85rem"
                        title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
        });

        if (contenedorProductos) contenedorProductos.innerHTML = html;

        renderResumen(data.subtotal, data.iva, data.total, data.items.length);

        // Guardar carrito en localStorage para que pago.js lo use
        localStorage.setItem('carrito_checkout', JSON.stringify({
            id_carrito: data.id_carrito,
            items: data.items,
            subtotal: data.subtotal,
            iva: data.iva,
            total: data.total
        }));

        // Eventos cantidad
        document.querySelectorAll('.btn-menos').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const qty = parseInt(btn.getAttribute('data-qty')) - 1;
                try {
                    await API.actualizarItemCarrito(id, qty);
                    await cargarCarritoDB();
                    if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
                } catch (e) { console.error(e); }
            });
        });
        document.querySelectorAll('.btn-mas').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const qty = parseInt(btn.getAttribute('data-qty')) + 1;
                try {
                    await API.actualizarItemCarrito(id, qty);
                    await cargarCarritoDB();
                    if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
                } catch (e) { console.error(e); }
            });
        });

        // Eliminar
        document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    await API.eliminarItemCarrito(id);
                    await cargarCarritoDB();
                    if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
                } catch (e) { alert('Error: ' + e.message); }
            });
        });
    }

    // ---- CARRITO PARA INVITADOS (desde localStorage) ----
    function cargarCarritoInvitado() {
        const items = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
        if (items.length === 0) { vacio(); return; }

        let html = cabecera();
        let subtotal = 0;

        items.forEach((item, idx) => {
            const itemSubtotal = Number(item.precio) * Number(item.cantidad);
            subtotal += itemSubtotal;
            html += `
            <div class="producto-item" data-idx="${idx}">
                <div class="col-producto info-producto">
                    <div class="producto-img" style="display:flex;align-items:center;justify-content:center;background:#f8fafc;border-radius:6px;width:56px;height:56px;color:#94a3b8">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="producto-detalles">
                        <span class="marca-badge">${item.nombre}</span>
                        <span class="producto-sku">ID: ${item.id_producto}</span>
                    </div>
                </div>
                <div class="col-cantidad">
                    <div style="display:flex;align-items:center;gap:6px">
                        <button onclick="cambiarCantidadInvitado(${idx}, -1)"
                            style="width:28px;height:28px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer">-</button>
                        <span style="min-width:24px;text-align:center;font-weight:600">${item.cantidad}</span>
                        <button onclick="cambiarCantidadInvitado(${idx}, 1)"
                            style="width:28px;height:28px;border:1px solid #e2e8f0;border-radius:4px;background:#fff;cursor:pointer">+</button>
                    </div>
                </div>
                <div class="col-precio precio-valor">${fmt(item.precio)}</div>
                <div class="col-subtotal subtotal-valor">${fmt(itemSubtotal)}</div>
                <div>
                    <button onclick="eliminarInvitado(${idx})"
                        style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px 8px;border-radius:4px">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>`;
        });

        if (contenedorProductos) contenedorProductos.innerHTML = html;

        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        renderResumen(subtotal, iva, total, items.length);

        // Aviso para iniciar sesión
        const aviso = document.createElement('div');
        aviso.style.cssText = 'background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;margin-top:14px;font-size:0.88rem;color:#9a3412;display:flex;align-items:center;gap:10px';
        aviso.innerHTML = '<i class="fas fa-sign-in-alt fa-lg"></i> <span><strong>Inicia sesión</strong> para guardar tu carrito y completar tu compra. <a href="../sesion/index.html" style="color:#ea580c;font-weight:700">Iniciar Sesión →</a></span>';
        if (contenedorProductos) contenedorProductos.appendChild(aviso);
    }

    window.cambiarCantidadInvitado = function(idx, delta) {
        const items = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
        items[idx].cantidad = Math.max(1, items[idx].cantidad + delta);
        localStorage.setItem('carrito_invitado', JSON.stringify(items));
        cargarCarritoInvitado();
        if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
    };

    window.eliminarInvitado = function(idx) {
        const items = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
        items.splice(idx, 1);
        localStorage.setItem('carrito_invitado', JSON.stringify(items));
        cargarCarritoInvitado();
        if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
    };

    // ---- Botón proceder al pago ----
    if (btnProceder) {
        btnProceder.addEventListener('click', (e) => {
            const user = API.getUsuarioActual();
            if (!user) {
                e.preventDefault();
                alert('Debes iniciar sesión para proceder al pago.');
                window.location.href = '../sesion/index.html';
            }
        });
    }

    // ---- Carga inicial ----
    try {
        const user = API.getUsuarioActual();
        if (user) {
            await cargarCarritoDB();
        } else {
            cargarCarritoInvitado();
        }
    } catch (err) {
        console.error('Error al cargar carrito:', err);
        vacio();
    }
});
