// =======================================================
// CATÁLOGO DE PRODUCTOS (TIENDA) - CONECTADO A MYSQL
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {

    const contenedorGrid = document.querySelector('.cuadricula-productos');
    const conteoEl = document.querySelector('.conteo-resultados');
    const opcionesCategorias = document.getElementById('filtros-categorias');
    const selectOrden = document.getElementById('select-orden');
    const busquedaInput = document.querySelector('.barra-busqueda input');
    const btnLimpiar = document.querySelector('.btn-limpiar');

    let todosLosProductos = [];
    let filtros = {
        categorias: [],
        busqueda: '',
        precioMin: 0,
        precioMax: Infinity,
        orden: 'destacados',
        soloDisponibles: false
    };

    function fmt(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    function iconoCategoria(nombre) {
        const n = (nombre || '').toLowerCase();
        if (n.includes('herra')) return 'fa-tools';
        if (n.includes('ferret')) return 'fa-hammer';
        if (n.includes('luz') || n.includes('ilum') || n.includes('electric')) return 'fa-bolt';
        if (n.includes('segur') || n.includes('epp')) return 'fa-hard-hat';
        if (n.includes('pintura')) return 'fa-paint-brush';
        return 'fa-box';
    }

    // ---- Cargar categorías desde la BD en el sidebar ----
    async function cargarCategorias() {
        if (!opcionesCategorias) return;
        try {
            const cats = await API.getCategorias();
            opcionesCategorias.innerHTML = '';

            // Opción "Todas"
            const labelTodas = document.createElement('label');
            labelTodas.className = 'etiqueta-checkbox';
            labelTodas.innerHTML = `
                <input type="checkbox" value="all" checked id="cat-all">
                <span class="marca-verificacion"></span>
                <i class="fas fa-th-large" style="margin-right:5px;color:#f97316"></i> Todas las categorías
            `;
            opcionesCategorias.appendChild(labelTodas);

            cats.forEach(c => {
                const label = document.createElement('label');
                label.className = 'etiqueta-checkbox';
                label.innerHTML = `
                    <input type="checkbox" value="${c.id_categoria}" class="check-categoria">
                    <span class="marca-verificacion"></span>
                    <i class="fas ${iconoCategoria(c.nombre_categoria)}" style="margin-right:5px;color:#64748b"></i>
                    ${c.nombre_categoria}
                    <span style="margin-left:auto;font-size:11px;color:#94a3b8">${c.total_productos || 0}</span>
                `;
                opcionesCategorias.appendChild(label);
            });

            // Eventos de filtro
            document.getElementById('cat-all').addEventListener('change', function() {
                document.querySelectorAll('.check-categoria').forEach(c => c.checked = false);
                filtros.categorias = [];
                renderizar();
            });

            document.querySelectorAll('.check-categoria').forEach(chk => {
                chk.addEventListener('change', () => {
                    document.getElementById('cat-all').checked = false;
                    filtros.categorias = [...document.querySelectorAll('.check-categoria:checked')]
                        .map(c => parseInt(c.value));
                    renderizar();
                });
            });

        } catch (e) { console.warn('Error cargando categorías:', e.message); }
    }

    // ---- Cargar todos los productos ----
    async function cargarProductos() {
        if (!contenedorGrid) return;
        try {
            contenedorGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px;color:#64748b">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p style="margin-top:12px;font-size:0.95rem">Cargando catálogo desde la base de datos...</p>
                </div>`;
            todosLosProductos = await API.getProductos();
            renderizar();
        } catch (err) {
            contenedorGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px;color:#ef4444">
                    <i class="fas fa-exclamation-circle fa-2x"></i>
                    <p style="margin-top:12px">Error al conectar con la base de datos: ${err.message}</p>
                </div>`;
        }
    }

    // ---- Filtrar y renderizar productos ----
    function renderizar() {
        let lista = todosLosProductos.filter(p => {
            const precio = Number(p.precio) || 0;
            const stock = Number(p.stock) || 0;

            const categoriaOk = filtros.categorias.length === 0 ||
                filtros.categorias.includes(p.id_categoria);

            const busquedaOk = !filtros.busqueda ||
                (p.nombre_producto || '').toLowerCase().includes(filtros.busqueda) ||
                (p.descripcion || '').toLowerCase().includes(filtros.busqueda) ||
                (p.nombre_categoria || '').toLowerCase().includes(filtros.busqueda);

            const precioOk = precio >= filtros.precioMin && precio <= filtros.precioMax;
            const dispOk = !filtros.soloDisponibles || stock > 0;

            return categoriaOk && busquedaOk && precioOk && dispOk;
        });

        // Ordenar
        if (filtros.orden === 'precio-asc') lista.sort((a, b) => a.precio - b.precio);
        else if (filtros.orden === 'precio-desc') lista.sort((a, b) => b.precio - a.precio);
        else if (filtros.orden === 'nombre') lista.sort((a, b) => (a.nombre_producto || '').localeCompare(b.nombre_producto || ''));
        else if (filtros.orden === 'stock-desc') lista.sort((a, b) => b.stock - a.stock);

        // Actualizar contador
        if (conteoEl) {
            conteoEl.innerHTML = `Mostrando <strong>${lista.length}</strong> de ${todosLosProductos.length} productos`;
        }

        contenedorGrid.innerHTML = '';

        if (lista.length === 0) {
            contenedorGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px;color:#64748b">
                    <i class="fas fa-search fa-2x" style="opacity:0.4"></i>
                    <p style="margin-top:12px">No se encontraron productos con los filtros seleccionados.</p>
                    <button onclick="location.reload()" style="margin-top:12px;padding:8px 18px;background:#f97316;color:#fff;border:none;border-radius:8px;cursor:pointer">Ver todos</button>
                </div>`;
            return;
        }

        lista.forEach(p => {
            const stock = Number(p.stock) || 0;
            const stockBajo = stock > 0 && stock < 10;
            const agotado = stock === 0;

            let insigniasHTML = '';
            if (agotado) insigniasHTML = '<span class="insignia insignia-roja">Agotado</span>';
            else if (stockBajo) insigniasHTML = '<span class="insignia insignia-naranja">Pocas Existencias</span>';
            else insigniasHTML = '<span class="insignia insignia-oscura">En Existencia</span>';

            const proveedor = (p.nombre_proveedor || 'EL BARATÓN').toUpperCase();
            const imagenHTML = p.imagen
                ? `<img src="${p.imagen}" alt="${p.nombre_producto}" class="imagen-producto" style="height:150px;object-fit:contain;width:100%">`
                : `<div style="height:150px;display:flex;align-items:center;justify-content:center;font-size:3.5rem;color:#cbd5e1;background:#f8fafc;border-radius:8px">
                    <i class="fas ${iconoCategoria(p.nombre_categoria)}"></i>
                   </div>`;

            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-producto';
            tarjeta.style.cursor = 'pointer';
            tarjeta.setAttribute('data-id', p.id_producto);

            tarjeta.innerHTML = `
                <div class="imagen-producto-contenedor-principal">
                    <div class="insignias">${insigniasHTML}</div>
                    ${imagenHTML}
                </div>
                <div class="info-producto">
                    <span class="marca">${proveedor}</span>
                    <h3 class="titulo-producto">
                        <a href="../detalle_producto/detalle_producto.html?id=${p.id_producto}"
                           style="color:inherit;text-decoration:none">
                            ${p.nombre_producto}
                        </a>
                    </h3>
                    <div class="calificacion">
                        <span class="estrellas">★★★★★</span>
                        <span class="resenas">(${stock} en stock)</span>
                    </div>
                    <div class="price-contenedor-principal">
                        <span class="precio-actual">${fmt(p.precio)}</span>
                    </div>
                    <button class="btn-agregar-carrito btn-add-cart-db"
                        data-id="${p.id_producto}"
                        ${agotado ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}
                        onclick="event.stopPropagation()">
                        <i class="fas fa-shopping-cart"></i>
                        ${agotado ? 'Sin Stock' : 'Agregar al Carrito'}
                    </button>
                </div>
            `;

            // Clic en tarjeta → ir al detalle
            tarjeta.addEventListener('click', () => {
                window.location.href = `../detalle_producto/detalle_producto.html?id=${p.id_producto}`;
            });

            contenedorGrid.appendChild(tarjeta);
        });

        // Botones de agregar al carrito
        document.querySelectorAll('.btn-add-cart-db').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                if (this.disabled) return;

                const id_producto = parseInt(this.getAttribute('data-id'));
                const originalHTML = this.innerHTML;

                this.disabled = true;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agregando...';

                try {
                    const usuario = API.getUsuarioActual();
                    if (!usuario) {
                        // Guardar en sessionStorage como invitado
                        let carrito = JSON.parse(sessionStorage.getItem('carrito_invitado') || '[]');
                        const prod = todosLosProductos.find(p => p.id_producto === id_producto);
                        const existing = carrito.find(i => i.id_producto === id_producto);
                        if (existing) {
                            existing.cantidad += 1;
                        } else if (prod) {
                            carrito.push({ id_producto, nombre: prod.nombre_producto, precio: prod.precio, cantidad: 1 });
                        }
                        sessionStorage.setItem('carrito_invitado', JSON.stringify(carrito));
                        this.innerHTML = '✓ ¡Agregado!';
                        this.style.background = '#10b981';
                    } else {
                        await API.agregarAlCarrito(id_producto, 1);
                        this.innerHTML = '✓ ¡Agregado!';
                        this.style.background = '#10b981';
                    }

                    setTimeout(() => {
                        this.innerHTML = originalHTML;
                        this.style.background = '';
                        this.disabled = false;
                    }, 2000);
                } catch (err) {
                    alert('Error al agregar al carrito: ' + err.message);
                    this.innerHTML = originalHTML;
                    this.disabled = false;
                }
            });
        });
    }

    // ---- Filtro por búsqueda ----
    if (busquedaInput) {
        busquedaInput.addEventListener('input', e => {
            filtros.busqueda = e.target.value.toLowerCase().trim();
            renderizar();
        });
    }

    // ---- Filtro por orden ----
    if (selectOrden) {
        selectOrden.addEventListener('change', e => {
            filtros.orden = e.target.value;
            renderizar();
        });
    }

    // ---- Filtro de disponibilidad ----
    const checkDisponible = document.getElementById('check-disponibles');
    if (checkDisponible) {
        checkDisponible.addEventListener('change', e => {
            filtros.soloDisponibles = e.target.checked;
            renderizar();
        });
    }

    // ---- Filtro de precio ----
    const precioMin = document.getElementById('precio-min');
    const precioMax = document.getElementById('precio-max');
    if (precioMin) {
        precioMin.addEventListener('input', () => {
            filtros.precioMin = Number(precioMin.value) || 0;
            renderizar();
        });
    }
    if (precioMax) {
        precioMax.addEventListener('input', () => {
            filtros.precioMax = Number(precioMax.value) || Infinity;
            renderizar();
        });
    }

    // ---- Limpiar filtros ----
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            filtros = { categorias: [], busqueda: '', precioMin: 0, precioMax: Infinity, orden: 'destacados', soloDisponibles: false };
            if (busquedaInput) busquedaInput.value = '';
            if (selectOrden) selectOrden.value = 'destacados';
            if (precioMin) precioMin.value = 0;
            if (precioMax) precioMax.value = '';
            document.querySelectorAll('.check-categoria').forEach(c => c.checked = false);
            const catAll = document.getElementById('cat-all');
            if (catAll) catAll.checked = true;
            renderizar();
        });
    }

    // ---- Toggle de grupos de filtro ----
    document.querySelectorAll('.titulo-filtro').forEach(titulo => {
        titulo.style.cursor = 'pointer';
        titulo.addEventListener('click', () => {
            const icon = titulo.querySelector('.icon');
            const opciones = titulo.nextElementSibling;
            if (opciones && opciones.classList.contains('opciones-filtro') ||
                opciones && opciones.id && opciones.id.startsWith('filtros')) {
                const visible = opciones.style.display !== 'none';
                opciones.style.display = visible ? 'none' : 'flex';
                if (icon) icon.textContent = visible ? 'v' : '^';
            }
        });
    });

    // ---- Carga inicial ----
    await cargarCategorias();
    await cargarProductos();
});
