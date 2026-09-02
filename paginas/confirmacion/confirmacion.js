/**
 * confirmacion.js
 * Logica de la pagina de Pedido Confirmado - Industrial Supply Co.
 * Conectado a MySQL: consulta el pedido real si viene ?pedido=X en la URL o en sessionStorage
 */

document.addEventListener('DOMContentLoaded', async function () {

    // MENU HAMBURGUESA (MOVIL)
    const btnMenu = document.getElementById('btnMenu');
    const navEnlaces = document.getElementById('navEnlaces');

    if (btnMenu && navEnlaces) {
        btnMenu.addEventListener('click', function () {
            navEnlaces.classList.toggle('abierto');
            btnMenu.classList.toggle('activo');
        });
        navEnlaces.querySelectorAll('a').forEach(function (enlace) {
            enlace.addEventListener('click', function () {
                navEnlaces.classList.remove('abierto');
                btnMenu.classList.remove('activo');
            });
        });
    }

    // CARGAR DATOS DEL PEDIDO
    await cargarDatosPedido();

    // BOLETIN DE SUSCRIPCION
    const formBoletin = document.getElementById('formBoletin');
    if (formBoletin) {
        formBoletin.addEventListener('submit', function (e) {
            e.preventDefault();
            const inputEmail = document.getElementById('inputEmail');
            if (inputEmail && inputEmail.value) {
                mostrarNotificacion('Suscripcion exitosa. Gracias por unirte a nuestro boletin.', 'exito');
                inputEmail.value = '';
            }
        });
    }

    // BUSQUEDA
    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const termino = inputBusqueda.value.trim();
                if (termino) {
                    window.location.href = '../productos/productos.html?busqueda=' + encodeURIComponent(termino);
                }
            }
        });
    }
});

// CARGAR DATOS DEL PEDIDO DESDE LA API O STORAGE
async function cargarDatosPedido() {
    try {
        const params = new URLSearchParams(window.location.search);
        const idPedidoUrl = params.get('pedido');

        const elNumeroOrden = document.getElementById('numeroOrden');
        const elFechaEntrega = document.getElementById('fechaEntrega');
        const elDireccion = document.getElementById('direccionEnvio');

        if (idPedidoUrl && typeof API !== 'undefined') {
            try {
                const pedido = await API.getPedido(idPedidoUrl);
                if (pedido) {
                    if (elNumeroOrden) elNumeroOrden.textContent = `#ORD-${pedido.id_pedido}`;
                    
                    // Fecha estimada (3 días hábiles después)
                    const fecha = new Date(pedido.fecha_pedido || Date.now());
                    fecha.setDate(fecha.getDate() + 3);
                    if (elFechaEntrega) {
                        elFechaEntrega.textContent = fecha.toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        });
                    }

                    if (elDireccion) {
                        elDireccion.innerHTML = escapeHTML(pedido.direccion_entrega || 'Dirección registrada').replace(/\n/g, '<br>');
                    }

                    if (pedido.items && Array.isArray(pedido.items)) {
                        renderizarArticulos(pedido.items.map(i => ({
                            nombre: i.nombre_producto || `Producto #${i.id_producto}`,
                            sku: `PROD-${i.id_producto}`,
                            cantidad: i.cantidad,
                            precio: i.precio_unitario || i.precio
                        })));
                    }
                    actualizarBadgeCarrito(0);
                    localStorage.removeItem('carrito_checkout');
                    sessionStorage.removeItem('carrito');
                    return;
                }
            } catch (errApi) {
                console.warn('No se pudo obtener el pedido por API, recurriendo a almacenamiento local:', errApi);
            }
        }

        // Si no está por URL o falló la API, buscar en sessionStorage
        const pedidoGuardado = sessionStorage.getItem('ultimoPedido');
        if (pedidoGuardado) {
            const pedido = JSON.parse(pedidoGuardado);
            if (pedido.numeroOrden && elNumeroOrden) elNumeroOrden.textContent = pedido.numeroOrden;
            if (pedido.fechaEntrega && elFechaEntrega) elFechaEntrega.textContent = pedido.fechaEntrega;
            if (pedido.direccion && elDireccion) elDireccion.innerHTML = pedido.direccion.replace(/\n/g, '<br>');
            if (pedido.articulos && Array.isArray(pedido.articulos)) {
                renderizarArticulos(pedido.articulos);
            }
            actualizarBadgeCarrito(0);
            sessionStorage.removeItem('carrito');
            localStorage.removeItem('carrito_checkout');
        } else if (idPedidoUrl && elNumeroOrden) {
            elNumeroOrden.textContent = `#ORD-${idPedidoUrl}`;
        }
    } catch (error) {
        console.error('Error al cargar datos del pedido:', error);
    }
}

// RENDERIZAR ARTICULOS EN LA LISTA
function renderizarArticulos(articulos) {
    const contenedor = document.getElementById('listaArticulos');
    if (!contenedor || !articulos.length) return;
    contenedor.innerHTML = '';
    articulos.forEach(function (articulo) {
        const item = document.createElement('div');
        item.classList.add('articulo-item');
        const icono = '<div class="articulo-icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>';
        const info = '<div class="articulo-info"><p class="articulo-nombre">' + articulo.cantidad + 'x ' + escapeHTML(articulo.nombre) + '</p><p class="articulo-sku">SKU: ' + escapeHTML(articulo.sku || 'N/A') + '</p></div>';
        item.innerHTML = icono + info;
        contenedor.appendChild(item);
    });
}

// ACTUALIZAR BADGE DEL CARRITO
function actualizarBadgeCarrito(cantidad) {
    const badge = document.getElementById('badgeCarrito');
    if (badge) {
        badge.textContent = cantidad;
        badge.style.display = cantidad > 0 ? 'flex' : 'none';
    }
}

// MOSTRAR NOTIFICACION TOAST
function mostrarNotificacion(mensaje, tipo) {
    const previo = document.querySelector('.notificacion-toast');
    if (previo) previo.remove();
    const toast = document.createElement('div');
    toast.className = 'notificacion-toast notificacion-' + tipo;
    toast.setAttribute('role', 'alert');
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '24px', right: '24px',
        background: tipo === 'exito' ? '#0f172a' : '#dc2626',
        color: '#ffffff', padding: '14px 20px', borderRadius: '8px',
        fontSize: '0.9rem', fontWeight: '500', zIndex: '9999',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)', transform: 'translateY(20px)',
        opacity: '0', transition: 'all 0.35s ease', fontFamily: "'Inter', sans-serif",
        borderLeft: tipo === 'exito' ? '4px solid #f59e0b' : '4px solid #fca5a5',
        maxWidth: '340px'
    });
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
    });
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(function () { if (toast.parentNode) toast.remove(); }, 350);
    }, 4000);
}

// SANITIZAR HTML
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
}
