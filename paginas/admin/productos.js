// PRODUCTOS JS (ESPAÑOL)

document.addEventListener('DOMContentLoaded', () => {
    let datosProductos = [
        { sku: 'IND-8821', nombre: 'Taladro Percutor Industrial 1200W', categoria: 'Herramientas Eléctricas', precio: 650000, stock: 42, proveedor: 'Bosch Industrial S.A.' },
        { sku: 'IND-4309', nombre: 'Kit de Eslingas de Carga Pesada 5 Ton', categoria: 'Ferretería Pesada', precio: 210500, stock: 8, proveedor: 'Suministros del Norte' },
        { sku: 'IND-1092', nombre: 'Casco de Seguridad Dieléctrico Clase E', categoria: 'EPP & Seguridad', precio: 60000, stock: 120, proveedor: '3M Colombia' },
        { sku: 'MET-772', nombre: 'Soldadora Inverter 250A Uso Continuo', categoria: 'Maquinaria & Equipos', precio: 1597700, stock: 5, proveedor: 'Lincoln Electric' },
        { sku: 'LOG-991', nombre: 'Transpaleta Hidráulica Manual 3 Ton', categoria: 'Maquinaria & Equipos', precio: 1750000, stock: 0, proveedor: 'Caterpillar Supply' }
    ];

    let filtroStockActual = 'all';
    let filtroCategoriaActual = 'all';
    let terminoBusquedaActual = '';
    let ordenActual = 'name-asc';

    const cuerpoTablaProductos = document.getElementById('cuerpoTablaProductos');
    const busquedaProductoInput = document.getElementById('busquedaProductoInput');
    const selectFiltroCategoria = document.getElementById('selectFiltroCategoria');
    const selectOrdenamiento = document.getElementById('selectOrdenamiento');
    const pestanasEstado = document.querySelectorAll('.boton-pestana');

    const modalProducto = document.getElementById('modalProducto');
    const btnNuevoProducto = document.getElementById('btnNuevoProducto');
    const btnCerrarModalProducto = document.getElementById('btnCerrarModalProducto');
    const btnCancelarProducto = document.getElementById('btnCancelarProducto');
    const formularioProducto = document.getElementById('formularioProducto');

    function formatearMoneda(val) {
        return '$ ' + Number(val).toLocaleString('es-CO');
    }

    function obtenerInsigniaStock(stock) {
        if (stock === 0) return '<span class="estado estado-agotado">● Agotado</span>';
        if (stock < 10) return '<span class="estado estado-bajo">● Stock Bajo</span>';
        return '<span class="estado estado-normal">● En Stock</span>';
    }

    function renderizarTabla() {
        let filtrados = datosProductos.filter(p => {
            const coincideBusqueda = !terminoBusquedaActual || p.nombre.toLowerCase().includes(terminoBusquedaActual) || p.sku.toLowerCase().includes(terminoBusquedaActual);
            const coincideCat = filtroCategoriaActual === 'all' || p.categoria === filtroCategoriaActual;
            let coincideStock = true;
            if (filtroStockActual === 'normal') coincideStock = p.stock >= 10;
            if (filtroStockActual === 'low') coincideStock = p.stock > 0 && p.stock < 10;
            if (filtroStockActual === 'out') coincideStock = p.stock === 0;
            return coincideBusqueda && coincideCat && coincideStock;
        });

        cuerpoTablaProductos.innerHTML = '';
        filtrados.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="insignia-sku">${p.sku}</span></td>
                <td><span class="celda-nombre-producto">${p.nombre}</span></td>
                <td>${p.categoria}</td>
                <td><span class="celda-precio">${formatearMoneda(p.precio)}</span></td>
                <td><span class="celda-stock">${p.stock} un.</span></td>
                <td>${obtenerInsigniaStock(p.stock)}</td>
                <td style="text-align: center;">
                    <button class="boton-accion" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            cuerpoTablaProductos.appendChild(tr);
        });
    }

    pestanasEstado.forEach(tab => {
        tab.addEventListener('click', function() {
            pestanasEstado.forEach(t => t.classList.remove('activo'));
            this.classList.add('activo');
            filtroStockActual = this.getAttribute('data-stock');
            renderizarTabla();
        });
    });

    busquedaProductoInput.addEventListener('input', function() {
        terminoBusquedaActual = this.value.trim().toLowerCase();
        renderizarTabla();
    });

    selectFiltroCategoria.addEventListener('change', function() {
        filtroCategoriaActual = this.value;
        renderizarTabla();
    });

    btnNuevoProducto.addEventListener('click', () => { formularioProducto.reset(); modalProducto.classList.add('activo'); });
    btnCerrarModalProducto.addEventListener('click', () => modalProducto.classList.remove('activo'));
    btnCancelarProducto.addEventListener('click', () => modalProducto.classList.remove('activo'));

    formularioProducto.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevo = {
            sku: document.getElementById('prodSku').value.trim(),
            nombre: document.getElementById('prodNombre').value.trim(),
            categoria: document.getElementById('prodCategoria').value,
            precio: parseFloat(document.getElementById('prodPrecio').value),
            stock: parseInt(document.getElementById('prodStock').value),
            proveedor: document.getElementById('prodProveedor').value.trim() || 'General'
        };
        datosProductos.unshift(nuevo);
        modalProducto.classList.remove('activo');
        renderizarTabla();
    });

    renderizarTabla();
});
