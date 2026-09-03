// ========== PRODUCTOS ADMIN - CONECTADO A MYSQL (100% SINCRONIZADO) ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datosProductos = [];
    let filtroStock = 'all';
    let filtroCategoria = 'all';
    let ordenActual = 'name-asc';
    let busqueda = '';
    let paginaActual = 1;
    const itemsPorPagina = 8;
    let modoEdicion = null; // id_producto si editando

    const tbody = document.getElementById('cuerpoTablaProductos');
    const busquedaInput = document.getElementById('busquedaProductoInput');
    const selectCategoria = document.getElementById('selectFiltroCategoria');
    const selectOrdenamiento = document.getElementById('selectOrdenamiento');
    const pestanasStock = document.querySelectorAll('.boton-pestana');
    const modal = document.getElementById('modalProducto');
    const tituloModal = document.getElementById('tituloModalProducto');
    const btnNuevo = document.getElementById('btnNuevoProducto');
    const btnCerrarModal = document.getElementById('btnCerrarModalProducto');
    const btnCancelar = document.getElementById('btnCancelarProducto');
    const form = document.getElementById('formularioProducto');
    const btnExportar = document.getElementById('btnExportarCSV');

    // Elementos KPI y Contadores
    const kpiTotal = document.getElementById('kpiTotalProductos');
    const kpiNormal = document.getElementById('kpiStockNormal');
    const kpiBajo = document.getElementById('kpiStockBajo');
    const kpiAgotados = document.getElementById('kpiAgotados');

    const conteoTodos = document.getElementById('conteoTodos');
    const conteoNormal = document.getElementById('conteoNormal');
    const conteoBajo = document.getElementById('conteoBajo');
    const conteoAgotado = document.getElementById('conteoAgotado');

    // Paginación
    const infoPaginacion = document.getElementById('infoPaginacion');
    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');
    const contenedorNumerosPagina = document.getElementById('contenedorNumerosPagina');

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function insigniaStock(stock) {
        const n = Number(stock) || 0;
        if (n === 0) return '<span class="estado estado-agotado">Agotado</span>';
        if (n < 10) return '<span class="estado estado-bajo">Stock Bajo</span>';
        return '<span class="estado estado-normal">En Stock</span>';
    }

    async function cargarCategorias() {
        try {
            const cats = await API.getCategorias();
            const selectCat = document.getElementById('prodCategoria');
            if (selectCat) {
                selectCat.innerHTML = '<option value="">-- Seleccionar categoría --</option>';
                cats.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id_categoria;
                    opt.textContent = c.nombre_categoria;
                    selectCat.appendChild(opt);
                });
            }
            if (selectCategoria) {
                selectCategoria.innerHTML = '<option value="all">Todas las categorías</option>';
                cats.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.nombre_categoria;
                    opt.textContent = c.nombre_categoria;
                    selectCategoria.appendChild(opt);
                });
            }
        } catch (e) { console.warn('Error cargando categorías:', e.message); }
    }

    async function cargarProveedores() {
        try {
            const provs = await API.getProveedores();
            const selectProv = document.getElementById('prodProveedor');
            if (selectProv) {
                selectProv.innerHTML = '<option value="">-- Seleccionar proveedor (opcional) --</option>';
                provs.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id_proveedor;
                    opt.textContent = p.nombre_proveedor;
                    selectProv.appendChild(opt);
                });
            }
        } catch (e) { console.warn('Error cargando proveedores:', e.message); }
    }

    // --- CARGAR PRODUCTOS DESDE MYSQL ---
    async function cargarProductos() {
        try {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:25px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando catálogo desde MySQL...</td></tr>`;
            }

            const [prods, pedidos, clientes] = await Promise.all([
                API.getProductos({ estado: 'activo' }),
                API.getPedidos().catch(() => []),
                API.getClientes().catch(() => [])
            ]);

            datosProductos = prods || [];

            // Actualizar contadores del Sidebar
            const bProd = document.getElementById('insigniaProductosBarra');
            const bPed = document.getElementById('insigniaPedidosBarra');
            const bCli = document.getElementById('insigniaClientesBarra');

            if (bProd) bProd.textContent = datosProductos.length;
            if (bPed) bPed.textContent = pedidos.length;
            if (bCli) bCli.textContent = clientes.length;

            actualizarKPIs();
            renderizar();
        } catch (err) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:25px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error al conectar con MySQL: ${err.message}</td></tr>`;
            }
        }
    }

    // --- ACTUALIZAR KPIS Y CONTADORES DE PESTAÑA ---
    function actualizarKPIs() {
        const total = datosProductos.length;
        let normal = 0;
        let bajo = 0;
        let agotados = 0;

        datosProductos.forEach(p => {
            const stock = Number(p.stock) || 0;
            if (stock === 0) agotados++;
            else if (stock < 10) bajo++;
            else normal++;
        });

        // KPIs
        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiNormal) kpiNormal.textContent = normal;
        if (kpiBajo) kpiBajo.textContent = bajo;
        if (kpiAgotados) kpiAgotados.textContent = agotados;

        // Pestañas
        if (conteoTodos) conteoTodos.textContent = total;
        if (conteoNormal) conteoNormal.textContent = normal;
        if (conteoBajo) conteoBajo.textContent = bajo;
        if (conteoAgotado) conteoAgotado.textContent = agotados;
    }

    // --- FILTRAR Y ORDENAR ---
    function obtenerProductosFiltrados() {
        let lista = datosProductos.filter(p => {
            const term = busqueda.toLowerCase();
            const sku = `prd-${p.id_producto}`.toLowerCase();
            const nombreOk = !term ||
                (p.nombre_producto || '').toLowerCase().includes(term) ||
                (p.descripcion || '').toLowerCase().includes(term) ||
                sku.includes(term);

            const catOk = filtroCategoria === 'all' || (p.nombre_categoria || '') === filtroCategoria;
            const stock = Number(p.stock) || 0;
            const stockOk = filtroStock === 'all' ||
                (filtroStock === 'normal' && stock >= 10) ||
                (filtroStock === 'low' && stock > 0 && stock < 10) ||
                (filtroStock === 'out' && stock === 0);

            return nombreOk && catOk && stockOk;
        });

        // Ordenamiento
        lista.sort((a, b) => {
            if (ordenActual === 'name-asc') return (a.nombre_producto || '').localeCompare(b.nombre_producto || '');
            if (ordenActual === 'name-desc') return (b.nombre_producto || '').localeCompare(a.nombre_producto || '');
            if (ordenActual === 'stock-desc') return (Number(b.stock) || 0) - (Number(a.stock) || 0);
            if (ordenActual === 'stock-asc') return (Number(a.stock) || 0) - (Number(b.stock) || 0);
            if (ordenActual === 'price-desc') return (parseFloat(b.precio) || 0) - (parseFloat(a.precio) || 0);
            if (ordenActual === 'price-asc') return (parseFloat(a.precio) || 0) - (parseFloat(b.precio) || 0);
            return 0;
        });

        return lista;
    }

    // --- RENDERIZAR TABLA ---
    function renderizar() {
        const filtrados = obtenerProductosFiltrados();
        const totalItems = filtrados.length;
        const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;

        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const corteActual = filtrados.slice(inicio, fin);

        if (!tbody) return;
        tbody.innerHTML = '';

        if (corteActual.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b">No se encontraron productos con los filtros seleccionados.</td></tr>`;
            actualizarPaginacion(0, 1);
            return;
        }

        corteActual.forEach(p => {
            const stock = Number(p.stock) || 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="insignia-sku">#PRD-${p.id_producto}</span></td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#ea580c; font-weight:bold;">
                            <i class="fas fa-box"></i>
                        </div>
                        <div>
                            <span class="celda-nombre-producto" style="font-weight:600; color:#0f172a;">${p.nombre_producto}</span>
                            <span style="display:block; font-size:0.75rem; color:#64748b;">${p.nombre_proveedor ? `Prov: ${p.nombre_proveedor}` : 'Catálogo propio'}</span>
                        </div>
                    </div>
                </td>
                <td><span class="insignia" style="background:#f8fafc; border:1px solid #e2e8f0; font-size:0.8rem;">${p.nombre_categoria || 'Sin categoría'}</span></td>
                <td><span class="celda-precio" style="font-weight:700; color:#0f172a;">${fmt(p.precio)}</span></td>
                <td><span class="celda-stock" style="font-weight:600;">${stock} un.</span></td>
                <td>${insigniaStock(stock)}</td>
                <td style="text-align:center;">
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="boton-accion btn-editar-prod" data-id="${p.id_producto}" title="Editar Producto"><i class="fas fa-edit"></i></button>
                        <button class="boton-accion btn-eliminar-prod" data-id="${p.id_producto}" title="Desactivar / Eliminar Producto" style="color:#ef4444"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Botones de editar
        document.querySelectorAll('.btn-editar-prod').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const prod = datosProductos.find(p => p.id_producto === id);
                if (!prod) return;

                modoEdicion = id;
                if (tituloModal) tituloModal.textContent = `Editar Producto #PRD-${id}`;

                document.getElementById('prodNombre').value = prod.nombre_producto || '';
                document.getElementById('prodPrecio').value = prod.precio || '';
                document.getElementById('prodStock').value = prod.stock || 0;
                document.getElementById('prodDescripcion').value = prod.descripcion || '';
                document.getElementById('prodCategoria').value = prod.id_categoria || '';
                document.getElementById('prodProveedor').value = prod.id_proveedor || '';

                // Cargar imagen principal
                if (inputProdImagen) inputProdImagen.value = prod.imagen || '';
                actualizarPreviewPrincipal(prod.imagen || '');

                // Cargar imágenes secundarias
                if (contenedorImagenesSecundarias) contenedorImagenesSecundarias.innerHTML = '';
                let secList = [];
                try {
                    if (prod.imagenes_secundarias) {
                        secList = typeof prod.imagenes_secundarias === 'string'
                            ? JSON.parse(prod.imagenes_secundarias)
                            : prod.imagenes_secundarias;
                    }
                } catch (_) {
                    if (typeof prod.imagenes_secundarias === 'string') {
                        secList = prod.imagenes_secundarias.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (Array.isArray(secList) && secList.length > 0) {
                    secList.forEach(url => agregarFilaImagenSecundaria(url));
                } else {
                    agregarFilaImagenSecundaria();
                }

                modal.classList.add('activo');
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar-prod').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const prod = datosProductos.find(p => String(p.id_producto) === String(id));
                const nombre = prod ? prod.nombre_producto : `#PRD-${id}`;

                if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}" del catálogo en la base de datos MySQL?`)) return;

                try {
                    await API.eliminarProducto(id);
                    alert(`¡Producto "${nombre}" eliminado del catálogo exitosamente!`);
                    await cargarProductos();
                } catch (err) {
                    alert('Error al eliminar producto: ' + err.message);
                }
            });
        });

        actualizarPaginacion(totalItems, totalPaginas);
    }

    // --- PAGINACIÓN ---
    function actualizarPaginacion(totalItems, totalPaginas) {
        if (!infoPaginacion) return;
        if (totalItems === 0) {
            infoPaginacion.textContent = 'Mostrando 0 de 0 productos';
            if (btnPaginaAnterior) btnPaginaAnterior.disabled = true;
            if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = true;
            if (contenedorNumerosPagina) contenedorNumerosPagina.innerHTML = '';
            return;
        }

        const inicio = (paginaActual - 1) * itemsPorPagina + 1;
        const fin = Math.min(paginaActual * itemsPorPagina, totalItems);
        infoPaginacion.textContent = `Mostrando ${inicio}-${fin} de ${totalItems} productos`;

        if (btnPaginaAnterior) btnPaginaAnterior.disabled = (paginaActual <= 1);
        if (btnPaginaSiguiente) btnPaginaSiguiente.disabled = (paginaActual >= totalPaginas);

        if (contenedorNumerosPagina) {
            contenedorNumerosPagina.innerHTML = '';
            for (let i = 1; i <= totalPaginas; i++) {
                const b = document.createElement('button');
                b.className = `numero-pagina ${i === paginaActual ? 'activo' : ''}`;
                b.textContent = i;
                b.addEventListener('click', () => {
                    paginaActual = i;
                    renderizar();
                });
                contenedorNumerosPagina.appendChild(b);
            }
        }
    }

    if (btnPaginaAnterior) {
        btnPaginaAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                renderizar();
            }
        });
    }

    if (btnPaginaSiguiente) {
        btnPaginaSiguiente.addEventListener('click', () => {
            const filtrados = obtenerProductosFiltrados();
            const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizar();
            }
        });
    }

    // --- EVENT LISTENERS DE FILTROS ---
    pestanasStock.forEach(tab => {
        tab.addEventListener('click', function() {
            pestanasStock.forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            filtroStock = this.getAttribute('data-stock') || 'all';
            paginaActual = 1;
            renderizar();
        });
    });

    if (busquedaInput) {
        busquedaInput.addEventListener('input', function() {
            busqueda = this.value.trim();
            paginaActual = 1;
            renderizar();
        });
    }

    if (selectCategoria) {
        selectCategoria.addEventListener('change', function() {
            filtroCategoria = this.value;
            paginaActual = 1;
            renderizar();
        });
    }

    if (selectOrdenamiento) {
        selectOrdenamiento.addEventListener('change', function() {
            ordenActual = this.value;
            paginaActual = 1;
            renderizar();
        });
    }

    // --- GESTIÓN DE IMAGEN PRINCIPAL E IMÁGENES SECUNDARIAS ---
    const inputProdImagen = document.getElementById('prodImagen');
    const inputProdImagenFile = document.getElementById('prodImagenFile');
    const contPreviewPrincipal = document.getElementById('previewImagenPrincipalCont');
    const imgPreviewPrincipal = document.getElementById('previewImagenPrincipal');
    const nombrePreviewPrincipal = document.getElementById('nombreImagenPrincipal');
    const btnQuitarImgPrincipal = document.getElementById('btnQuitarImgPrincipal');
    const btnAgregarImgSecundaria = document.getElementById('btnAgregarImgSecundaria');
    const contenedorImagenesSecundarias = document.getElementById('contenedorImagenesSecundarias');

    function actualizarPreviewPrincipal(url, nombre = '') {
        if (!contPreviewPrincipal || !imgPreviewPrincipal) return;
        if (url && url.trim()) {
            imgPreviewPrincipal.src = url.trim();
            if (nombrePreviewPrincipal) nombrePreviewPrincipal.textContent = nombre || url.trim();
            contPreviewPrincipal.style.display = 'flex';
        } else {
            imgPreviewPrincipal.src = '';
            if (nombrePreviewPrincipal) nombrePreviewPrincipal.textContent = '';
            contPreviewPrincipal.style.display = 'none';
        }
    }

    // Optimizar imagen cargada para almacenamiento rápido y ligero
    function procesarArchivoImagen(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 1200;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                callback(optimizedDataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (inputProdImagen) {
        inputProdImagen.addEventListener('input', () => {
            actualizarPreviewPrincipal(inputProdImagen.value);
        });
    }

    if (inputProdImagenFile) {
        inputProdImagenFile.addEventListener('change', () => {
            const file = inputProdImagenFile.files[0];
            if (file) {
                procesarArchivoImagen(file, (dataUrl) => {
                    if (inputProdImagen) inputProdImagen.value = dataUrl;
                    actualizarPreviewPrincipal(dataUrl, file.name);
                });
            }
        });
    }

    if (btnQuitarImgPrincipal) {
        btnQuitarImgPrincipal.addEventListener('click', () => {
            if (inputProdImagen) inputProdImagen.value = '';
            if (inputProdImagenFile) inputProdImagenFile.value = '';
            actualizarPreviewPrincipal('');
        });
    }

    // Funciones para Imágenes Secundarias
    function agregarFilaImagenSecundaria(urlInicial = '') {
        if (!contenedorImagenesSecundarias) return;

        const row = document.createElement('div');
        row.className = 'fila-img-secundaria';
        row.style.cssText = 'display:flex;gap:8px;align-items:center;background:#fff;padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;';

        const imgPreview = document.createElement('img');
        imgPreview.src = urlInicial || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' fill='%23f1f5f9'%3E%3Crect width='50' height='50'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3E+%3C/text%3E%3C/svg%3E";
        imgPreview.style.cssText = 'width:42px;height:42px;object-fit:contain;border:1px solid #e2e8f0;border-radius:4px;background:#f8fafc;padding:2px;';

        const inputUrl = document.createElement('input');
        inputUrl.type = 'text';
        inputUrl.className = 'entrada-filtro input-secundaria-url';
        inputUrl.placeholder = 'URL imagen secundaria (ej: https://... o ../../img/detalle1.jpg)';
        inputUrl.value = urlInicial;
        inputUrl.style.cssText = 'flex:1;font-size:0.85rem;padding:7px 10px;';

        const labelFile = document.createElement('label');
        labelFile.className = 'boton boton-secundario';
        labelFile.style.cssText = 'cursor:pointer;padding:6px 10px;font-size:0.75rem;margin:0;white-space:nowrap;';
        labelFile.innerHTML = '<i class="fas fa-folder"></i>';
        labelFile.title = 'Subir archivo de imagen';

        const inputFile = document.createElement('input');
        inputFile.type = 'file';
        inputFile.accept = 'image/*';
        inputFile.style.display = 'none';

        labelFile.appendChild(inputFile);

        inputFile.addEventListener('change', () => {
            const file = inputFile.files[0];
            if (file) {
                procesarArchivoImagen(file, (dataUrl) => {
                    inputUrl.value = dataUrl;
                    imgPreview.src = dataUrl;
                });
            }
        });

        inputUrl.addEventListener('input', () => {
            imgPreview.src = inputUrl.value.trim() || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' fill='%23f1f5f9'%3E%3Crect width='50' height='50'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3E+%3C/text%3E%3C/svg%3E";
        });

        const btnQuitar = document.createElement('button');
        btnQuitar.type = 'button';
        btnQuitar.className = 'boton-accion';
        btnQuitar.style.cssText = 'color:#ef4444;background:none;border:none;cursor:pointer;padding:6px;font-size:0.9rem;';
        btnQuitar.title = 'Eliminar imagen secundaria';
        btnQuitar.innerHTML = '<i class="fas fa-trash-alt"></i>';
        btnQuitar.addEventListener('click', () => row.remove());

        row.appendChild(imgPreview);
        row.appendChild(inputUrl);
        row.appendChild(labelFile);
        row.appendChild(btnQuitar);

        contenedorImagenesSecundarias.appendChild(row);
    }

    if (btnAgregarImgSecundaria) {
        btnAgregarImgSecundaria.addEventListener('click', () => agregarFilaImagenSecundaria());
    }

    function obtenerImagenesSecundarias() {
        if (!contenedorImagenesSecundarias) return [];
        const urls = [];
        contenedorImagenesSecundarias.querySelectorAll('.input-secundaria-url').forEach(inp => {
            const val = inp.value.trim();
            if (val) urls.push(val);
        });
        return urls;
    }

    // --- MODAL CREAR / EDITAR PRODUCTO ---
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            modoEdicion = null;
            if (tituloModal) tituloModal.textContent = 'Registrar Nuevo Producto';
            form.reset();
            if (inputProdImagen) inputProdImagen.value = '';
            if (inputProdImagenFile) inputProdImagenFile.value = '';
            actualizarPreviewPrincipal('');
            if (contenedorImagenesSecundarias) contenedorImagenesSecundarias.innerHTML = '';
            agregarFilaImagenSecundaria();
            modal.classList.add('activo');
        });
    }

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', () => modal.classList.remove('activo'));
    if (btnCancelar) btnCancelar.addEventListener('click', () => modal.classList.remove('activo'));

    // Helper de validación modal producto
    function mostrarErrorProd(input, msg) {
        limpiarErrorProd(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-prod-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorProd(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-prod-msg')) sig.remove();
    }

    ['prodNombre', 'prodPrecio', 'prodStock', 'prodCategoria'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => limpiarErrorProd(el));
        if (el) el.addEventListener('change', () => limpiarErrorProd(el));
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const elNombre = document.getElementById('prodNombre');
            const elPrecio = document.getElementById('prodPrecio');
            const elStock = document.getElementById('prodStock');
            const elCat = document.getElementById('prodCategoria');
            const elProv = document.getElementById('prodProveedor');
            const elDesc = document.getElementById('prodDescripcion');

            const nombre_producto = elNombre.value.trim();
            const precioRaw = elPrecio.value.trim();
            const precio = parseFloat(precioRaw);
            const stockRaw = elStock.value.trim();
            const stock = parseInt(stockRaw);
            const id_categoria = parseInt(elCat.value);
            const id_proveedor = parseInt(elProv.value) || null;
            const descripcion = elDesc.value.trim();

            let esValido = true;

            if (!nombre_producto || nombre_producto.length < 3) {
                mostrarErrorProd(elNombre, 'El nombre debe tener al menos 3 caracteres.');
                esValido = false;
            } else {
                limpiarErrorProd(elNombre);
            }

            if (!precioRaw || isNaN(precio) || precio <= 0) {
                mostrarErrorProd(elPrecio, 'El precio debe ser un número mayor a cero.');
                esValido = false;
            } else {
                limpiarErrorProd(elPrecio);
            }

            if (stockRaw === '' || isNaN(stock) || stock < 0) {
                mostrarErrorProd(elStock, 'El stock debe ser un número entero mayor o igual a 0.');
                esValido = false;
            } else {
                limpiarErrorProd(elStock);
            }

            if (!id_categoria || isNaN(id_categoria)) {
                mostrarErrorProd(elCat, 'Por favor selecciona una categoría.');
                esValido = false;
            } else {
                limpiarErrorProd(elCat);
            }

            if (!esValido) return;

            const btnSubmit = form.querySelector('button[type="submit"]');
            const originalHTML = btnSubmit.innerHTML;

            const imagenPrincipal = inputProdImagen ? inputProdImagen.value.trim() : null;
            const imagenesSecundarias = obtenerImagenesSecundarias();

            const payload = {
                nombre_producto,
                precio,
                stock,
                stock_inicial: stock,
                id_categoria,
                id_proveedor,
                descripcion,
                imagen: imagenPrincipal || null,
                imagenes_secundarias: imagenesSecundarias.length > 0 ? imagenesSecundarias : null,
                estado: 'activo'
            };

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando en BD...';

                if (modoEdicion) {
                    await API.actualizarProducto(modoEdicion, payload);
                    alert(`¡Producto "${nombre_producto}" actualizado exitosamente con sus imágenes en MySQL!`);
                } else {
                    await API.crearProducto(payload);
                    alert(`¡Producto "${nombre_producto}" registrado exitosamente con sus imágenes en MySQL!`);
                }

                modal.classList.remove('activo');
                form.reset();
                modoEdicion = null;
                await cargarProductos();
            } catch (err) {
                alert('Error al guardar producto en MySQL: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    // --- EXPORTAR CSV ---
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            if (datosProductos.length === 0) {
                alert('No hay productos para exportar.');
                return;
            }
            let csv = 'ID_Producto,SKU,Nombre,Categoria,Proveedor,Precio,Stock\n';
            datosProductos.forEach(p => {
                csv += `${p.id_producto},"#PRD-${p.id_producto}","${p.nombre_producto}","${p.nombre_categoria || ''}","${p.nombre_proveedor || ''}",${p.precio},${p.stock || 0}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `catalogo_productos_baraton_${new Date().toISOString().slice(0,10)}.csv`;
            link.click();
        });
    }

    // Inicialización
    await cargarCategorias();
    await cargarProveedores();
    await cargarProductos();
});
