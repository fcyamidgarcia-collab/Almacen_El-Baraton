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
        document.title = `${p.nombre_producto} - El Baratón`;

        // Breadcrumb
        const breadCat = document.getElementById('bread-categoria');
        const breadProd = document.getElementById('bread-producto');
        if (breadCat) breadCat.textContent = p.nombre_categoria || 'Productos';
        if (breadProd) breadProd.textContent = p.nombre_producto;

        // Imagen principal
        const mainImg = document.getElementById('mainImage');
        if (mainImg) {
            mainImg.src = p.imagen || `https://via.placeholder.com/600x400?text=${encodeURIComponent(p.nombre_producto)}`;
            mainImg.alt = p.nombre_producto;
        }

        // Marca / Proveedor
        const brandEl = document.getElementById('prod-marca');
        if (brandEl) brandEl.textContent = (p.nombre_proveedor || 'EL BARATÓN').toUpperCase();

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

        // ---- AGREGAR AL CARRITO ----
        if (btnCarrito && !agotado) {
            btnCarrito.addEventListener('click', async () => {
                const cantidad = parseInt(qtyInput?.value) || 1;
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
                    } else {
                        await API.agregarAlCarrito(parseInt(id), cantidad);
                        btnCarrito.innerHTML = '✓ ¡Agregado al carrito!';
                        btnCarrito.style.background = '#10b981';
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
                            <span class="fbt-brand">${(r.nombre_proveedor || 'El Baratón').toUpperCase()}</span>
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
