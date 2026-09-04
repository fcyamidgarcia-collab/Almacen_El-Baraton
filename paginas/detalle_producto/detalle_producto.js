// =======================================================
// DETALLE PRODUCTO - CONECTADO A MYSQL
// Lee ?id=X de la URL y carga el producto desde la BD
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {

    // ---- Leer ID del producto desde la URL ----
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        mostrarError('No se especificó un producto. <a href="../productos/productos.html">Volver a la tienda</a>');
        return;
    }

    function fmt(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    function mostrarError(msg) {
        const main = document.querySelector('.product-main');
        if (main) main.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:80px;color:#ef4444">
                <i class="fas fa-exclamation-circle fa-3x" style="opacity:0.5"></i>
                <p style="margin-top:16px;font-size:1.1rem">${msg}</p>
            </div>`;
    }

    // ---- Carga del producto ----
    try {
        const p = await API.getProducto(id);

        const stock = Number(p.stock) || 0;
        const agotado = stock === 0;
        const stockBajo = stock > 0 && stock < 10;

        // Título de la página
        document.title = `${p.nombre_producto} - Almacen El Baraton`;

        // Breadcrumb
        const breadCat = document.getElementById('bread-categoria');
        const breadProd = document.getElementById('bread-producto');
        if (breadCat) breadCat.textContent = p.nombre_categoria || 'Productos';
        if (breadProd) breadProd.textContent = p.nombre_producto;

        // Imagen principal y galería interactiva
        const mainImg = document.getElementById('mainImage');
        const imagenPrincipal = p.imagen || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' fill='%23f1f5f9'%3E%3Crect width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2394a3b8'%3E${encodeURIComponent(p.nombre_producto)}%3C/text%3E%3C/svg%3E`;
        if (mainImg) {
            mainImg.src = imagenPrincipal;
            mainImg.alt = p.nombre_producto;
        }

        // Galería de miniaturas (Principal + Secundarias)
        const listaMiniaturas = document.querySelector('.miniaturanail-list');
        if (listaMiniaturas) {
            listaMiniaturas.innerHTML = '';

            // 1. Miniatura Principal
            const miniaturaPrincipal = document.createElement('div');
            miniaturaPrincipal.className = 'miniaturanail activo';
            miniaturaPrincipal.title = 'Vista principal';
            miniaturaPrincipal.innerHTML = `<img src="${imagenPrincipal}" alt="${p.nombre_producto} - Principal">`;
            miniaturaPrincipal.addEventListener('click', function() {
                window.changeImage(this, imagenPrincipal);
            });
            listaMiniaturas.appendChild(miniaturaPrincipal);

            // 2. Parsear y agregar imágenes secundarias
            let secList = [];
            try {
                if (p.imagenes_secundarias) {
                    secList = typeof p.imagenes_secundarias === 'string'
                        ? JSON.parse(p.imagenes_secundarias)
                        : p.imagenes_secundarias;
                }
            } catch (_) {
                if (typeof p.imagenes_secundarias === 'string') {
                    secList = p.imagenes_secundarias.split(',').map(s => s.trim()).filter(Boolean);
                }
            }

            if (Array.isArray(secList)) {
                secList.forEach((url, idx) => {
                    if (!url || !url.trim()) return;
                    const cleanUrl = url.trim();
                    const miniaturaSec = document.createElement('div');
                    miniaturaSec.className = 'miniaturanail';
                    miniaturaSec.title = `Vista adicional ${idx + 1}`;
                    miniaturaSec.innerHTML = `<img src="${cleanUrl}" alt="${p.nombre_producto} - Vista ${idx + 1}">`;
                    miniaturaSec.addEventListener('click', function() {
                        window.changeImage(this, cleanUrl);
                    });
                    listaMiniaturas.appendChild(miniaturaSec);
                });
            }
        }

        // Marca / Proveedor
        const brandEl = document.getElementById('prod-marca');
        if (brandEl) brandEl.textContent = (p.nombre_proveedor || 'Almacen El Baraton').toUpperCase();

        // Título
        const tituloEl = document.getElementById('prod-titulo');
        if (tituloEl) tituloEl.textContent = p.nombre_producto;

        // Número de artículo
        const metaEl = document.getElementById('prod-meta');
        if (metaEl) metaEl.textContent = `Art. N° ${p.id_producto} | Categoría: ${p.nombre_categoria || 'General'}`;

        // Precio
        const precioEl = document.getElementById('prod-precio');
        if (precioEl) precioEl.innerHTML = `${fmt(p.precio)} <span class="unit">/ cada uno</span>`;

        // Stock badge
        const stockBadge = document.getElementById('prod-stock-badge');
        const stockMsg = document.getElementById('prod-stock-msg');
        if (stockBadge) {
            if (agotado) {
                stockBadge.innerHTML = '<i class="fas fa-times-circle" style="color:#ef4444"></i> <span style="color:#ef4444">Agotado</span>';
            } else if (stockBajo) {
                stockBadge.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:#f97316"></i> <span style="color:#f97316">Pocas unidades (${stock} disponibles)</span>`;
            } else {
                stockBadge.innerHTML = `<i class="fas fa-check-circle" style="color:#10b981"></i> <span style="color:#10b981">En Stock (${stock} disponibles)</span>`;
            }
        }
        if (stockMsg) {
            stockMsg.textContent = agotado ? 'Producto sin stock disponible' : 'Envío disponible en Colombia';
        }

        // Descripción en tab
        const descEl = document.getElementById('desc');
        if (descEl && p.descripcion) {
            descEl.innerHTML = `<p>${p.descripcion}</p>`;
        }

        // Limit qty to stock
        const qtyInput = document.getElementById('qtyInput');
        if (qtyInput && stock > 0) {
            qtyInput.max = stock;
        }

        // Deshabilitar botón si agotado
        const btnCarrito = document.getElementById('btn-agregar-carrito');
        if (btnCarrito && agotado) {
            btnCarrito.disabled = true;
            btnCarrito.textContent = 'Sin Stock';
            btnCarrito.style.opacity = '0.5';
            btnCarrito.style.cursor = 'not-allowed';
        }

        // ---- AGREGAR AL CARRITO CON VALIDACIÓN DIRECTA ----
        if (btnCarrito && !agotado) {
            const contenedorQty = qtyInput?.parentElement;

            function mostrarErrorQty(msg) {
                limpiarErrorQty();
                if (qtyInput) {
                    qtyInput.style.borderColor = '#ef4444';
                    qtyInput.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                }
                const span = document.createElement('span');
                span.className = 'error-qty-msg';
                span.style.cssText = 'color:#ef4444;font-size:0.78rem;display:block;margin-top:4px;font-weight:600;';
                span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
                contenedorQty?.insertAdjacentElement('afterend', span);
            }

            function limpiarErrorQty() {
                if (qtyInput) {
                    qtyInput.style.borderColor = '';
                    qtyInput.style.boxShadow = '';
                }
                const msg = contenedorQty?.parentElement?.querySelector('.error-qty-msg');
                if (msg) msg.remove();
            }

            if (qtyInput) {
                qtyInput.addEventListener('input', () => {
                    limpiarErrorQty();
                    let val = parseInt(qtyInput.value);
                    if (val > stock) {
                        mostrarErrorQty(`Máximo disponible: ${stock} unidades.`);
                    }
                });
            }

            btnCarrito.addEventListener('click', async () => {
                limpiarErrorQty();
                const cantidad = parseInt(qtyInput?.value);

                if (isNaN(cantidad) || cantidad < 1) {
                    mostrarErrorQty('La cantidad mínima a agregar es 1.');
                    if (qtyInput) qtyInput.value = 1;
                    return;
                }

                if (cantidad > stock) {
                    mostrarErrorQty(`Solo hay ${stock} unidades disponibles en stock.`);
                    return;
                }

                const originalHTML = btnCarrito.innerHTML;
                btnCarrito.disabled = true;
                btnCarrito.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';

                try {
                    const usuario = API.getUsuarioActual();
                    if (!usuario) {
                        // Guardar en localStorage como invitado
                        let carrito = JSON.parse(localStorage.getItem('carrito_invitado') || '[]');
                        const existing = carrito.find(i => i.id_producto == id);
                        if (existing) {
                            existing.cantidad += cantidad;
                        } else {
                            carrito.push({
                                id_producto: parseInt(id),
                                nombre: p.nombre_producto,
                                precio: p.precio,
                                imagen: p.imagen || null,
                                cantidad
                            });
                        }
                        localStorage.setItem('carrito_invitado', JSON.stringify(carrito));
                        btnCarrito.innerHTML = '✓ ¡Agregado!';
                        btnCarrito.style.background = '#10b981';
                        if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
                    } else {
                        await API.agregarAlCarrito(parseInt(id), cantidad);
                        btnCarrito.innerHTML = '✓ ¡Agregado al carrito!';
                        btnCarrito.style.background = '#10b981';
                        if (window.actualizarInsigniaCarrito) window.actualizarInsigniaCarrito();
                    }

                    setTimeout(() => {
                        btnCarrito.innerHTML = originalHTML;
                        btnCarrito.style.background = '';
                        btnCarrito.disabled = false;
                    }, 2500);
                } catch (err) {
                    alert('Error al agregar al carrito: ' + err.message);
                    btnCarrito.innerHTML = originalHTML;
                    btnCarrito.disabled = false;
                }
            });
        }

        // ---- Productos relacionados (misma categoría) ----
        const relacionadosGrid = document.getElementById('grid-relacionados');
        if (relacionadosGrid && p.id_categoria) {
            try {
                const todos = await API.getProductos({ categoria: p.id_categoria });
                const relacionados = todos.filter(r => r.id_producto != id).slice(0, 4);

                if (relacionados.length > 0) {
                    relacionadosGrid.innerHTML = '';
                    relacionados.forEach(r => {
                        const card = document.createElement('div');
                        card.className = 'fbt-card';
                        card.style.cursor = 'pointer';
                        card.innerHTML = `
                            <div style="height:120px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-radius:8px;margin-bottom:8px">
                                ${r.imagen ? `<img src="${r.imagen}" alt="${r.nombre_producto}" style="max-height:110px;object-fit:contain">` :
                                `<i class="fas fa-tools fa-3x" style="color:#cbd5e1"></i>`}
                            </div>
                            <h4 class="fbt-title">${r.nombre_producto}</h4>
                            <span class="fbt-brand">${(r.nombre_proveedor || 'Almacen El Baraton').toUpperCase()}</span>
                            <div class="fbt-price">${fmt(r.precio)}</div>
                        `;
                        card.addEventListener('click', () => {
                            window.location.href = `detalle_producto.html?id=${r.id_producto}`;
                        });
                        relacionadosGrid.appendChild(card);
                    });
                }
            } catch (e) { console.warn('Error relacionados:', e.message); }
        }

    } catch (err) {
        mostrarError(`Error al cargar el producto: ${err.message}. <a href="../productos/productos.html">Volver a la tienda</a>`);
    }

    // ---- Selector de cantidad ----
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const qtyInput = document.getElementById('qtyInput');

    if (btnMinus && btnPlus && qtyInput) {
        btnMinus.addEventListener('click', () => {
            const val = parseInt(qtyInput.value) || 1;
            if (val > 1) qtyInput.value = val - 1;
        });
        btnPlus.addEventListener('click', () => {
            const val = parseInt(qtyInput.value) || 1;
            const max = parseInt(qtyInput.max) || 9999;
            if (val < max) qtyInput.value = val + 1;
        });
        qtyInput.addEventListener('change', () => {
            if (qtyInput.value < 1 || isNaN(qtyInput.value)) qtyInput.value = 1;
        });
    }

    // ---- Cambio de imagen en miniaturas ----
    window.changeImage = function(element, newSrc) {
        document.querySelectorAll('.miniaturanail').forEach(t => t.classList.remove('activo'));
        element.classList.add('activo');
        const mainImg = document.getElementById('mainImage');
        if (mainImg) mainImg.src = newSrc;
    };

    // ---- Tabs ----
    document.querySelectorAll('.btn-pestana').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-pestana').forEach(b => b.classList.remove('activo'));
            document.querySelectorAll('.contenido-pestana').forEach(c => c.classList.remove('activo'));
            btn.classList.add('activo');
            const target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.classList.add('activo');
        });
    });
});
