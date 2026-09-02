// ========== PRODUCTOS ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datosProductos = [];
    let filtroStock = 'all';
    let filtroCategoria = 'all';
    let busqueda = '';
    let modoEdicion = null; // id_producto si editando

    const tbody = document.getElementById('cuerpoTablaProductos');
    const busquedaInput = document.getElementById('busquedaProductoInput');
    const selectCategoria = document.getElementById('selectFiltroCategoria');
    const modal = document.getElementById('modalProducto');
    const btnNuevo = document.getElementById('btnNuevoProducto');
    const btnCerrarModal = document.getElementById('btnCerrarModalProducto');
    const btnCancelar = document.getElementById('btnCancelarProducto');
    const form = document.getElementById('formularioProducto');

    function fmt(val) { return '$ ' + Number(val || 0).toLocaleString('es-CO'); }

    function insigniaStock(stock) {
        const n = Number(stock) || 0;
        if (n === 0) return '<span class="estado estado-agotado">● Agotado</span>';
        if (n < 10) return '<span class="estado estado-bajo">● Stock Bajo</span>';
        return '<span class="estado estado-normal">● En Stock</span>';
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
            // También llenar el filtro de la tabla
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

    async function cargarProductos() {
        try {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;
            datosProductos = await API.getProductos({ estado: 'activo' });
            const badge = document.getElementById('insigniaProductosBarra');
            if (badge) badge.textContent = datosProductos.length;
            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        let lista = datosProductos.filter(p => {
            const nombreOk = !busqueda || (p.nombre_producto || '').toLowerCase().includes(busqueda);
            const catOk = filtroCategoria === 'all' || (p.nombre_categoria || '') === filtroCategoria;
            const stock = Number(p.stock) || 0;
            const stockOk = filtroStock === 'all' ||
                (filtroStock === 'normal' && stock >= 10) ||
                (filtroStock === 'low' && stock > 0 && stock < 10) ||
                (filtroStock === 'out' && stock === 0);
            return nombreOk && catOk && stockOk;
        });

        tbody.innerHTML = '';
        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:25px;color:#64748b">No hay productos con los filtros seleccionados.</td></tr>`;
            return;
        }

        lista.forEach(p => {
            const stock = Number(p.stock) || 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="insignia-sku">#${p.id_producto}</span></td>
                <td><span class="celda-nombre-producto">${p.nombre_producto}</span></td>
                <td>${p.nombre_categoria || 'Sin categoría'}</td>
                <td><span class="celda-precio">${fmt(p.precio)}</span></td>
                <td><span class="celda-stock">${stock} un.</span></td>
                <td>${insigniaStock(stock)}</td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-prod" data-id="${p.id_producto}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion btn-eliminar-prod" data-id="${p.id_producto}" title="Eliminar" style="color:#ef4444"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Editar
        document.querySelectorAll('.btn-editar-prod').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const prod = datosProductos.find(p => p.id_producto === id);
                if (!prod) return;
                modoEdicion = id;
                document.getElementById('prodNombre').value = prod.nombre_producto || '';
                document.getElementById('prodPrecio').value = prod.precio || '';
                document.getElementById('prodStock').value = prod.stock || 0;
                const selectCat = document.getElementById('prodCategoria');
                if (selectCat) selectCat.value = prod.id_categoria || '';
                const selectProv = document.getElementById('prodProveedor');
                if (selectProv) selectProv.value = prod.id_proveedor || '';
                const descEl = document.getElementById('prodDescripcion');
                if (descEl) descEl.value = prod.descripcion || '';
                modal.classList.add('activo');
            });
        });

        // Eliminar
        document.querySelectorAll('.btn-eliminar-prod').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('¿Desactivar este producto de la base de datos?')) return;
                try {
                    await API.eliminarProducto(id);
                    await cargarProductos();
                } catch (err) { alert('Error: ' + err.message); }
            });
        });
    }

    // Filtros
    if (busquedaInput) busquedaInput.addEventListener('input', e => { busqueda = e.target.value.toLowerCase(); renderizar(); });
    if (selectCategoria) selectCategoria.addEventListener('change', e => { filtroCategoria = e.target.value; renderizar(); });
    document.querySelectorAll('.boton-pestana').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.boton-pestana').forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            filtroStock = this.getAttribute('data-stock') || 'all';
            renderizar();
        });
    });

    // Modal
    btnNuevo?.addEventListener('click', () => { modoEdicion = null; form.reset(); modal.classList.add('activo'); });
    btnCerrarModal?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    // Submit formulario
    form?.addEventListener('submit', async e => {
        e.preventDefault();
        const datos = {
            nombre_producto: document.getElementById('prodNombre').value.trim(),
            precio: parseFloat(document.getElementById('prodPrecio').value),
            stock_inicial: parseInt(document.getElementById('prodStock').value) || 0,
            id_categoria: parseInt(document.getElementById('prodCategoria')?.value) || null,
            id_proveedor: parseInt(document.getElementById('prodProveedor')?.value) || null,
            descripcion: document.getElementById('prodDescripcion')?.value.trim() || '',
            estado: 'activo'
        };
        try {
            if (modoEdicion) {
                await API.actualizarProducto(modoEdicion, datos);
                alert('¡Producto actualizado exitosamente!');
            } else {
                await API.crearProducto(datos);
                alert('¡Producto creado exitosamente en MySQL!');
            }
            modal.classList.remove('activo');
            form.reset();
            modoEdicion = null;
            await cargarProductos();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargarCategorias();
    await cargarProveedores();
    await cargarProductos();
});
