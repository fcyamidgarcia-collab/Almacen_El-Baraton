// =======================================================
// CATÁLOGO DE PRODUCTOS (TIENDA) - CONECTADO A MYSQL
// =======================================================

document.addEventListener('DOMContentLoaded', async () => {
    const contenedorGrid = document.querySelector('.cuadricula-productos');

    function formatearMoneda(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    async function cargarCatalogoDesdeBD() {
        if (!contenedorGrid) return;

        try {
            contenedorGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Cargando catálogo en tiempo real desde la base de datos...</p></div>`;
            const productos = await API.getProductos();

            if (productos.length === 0) {
                contenedorGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">No hay productos disponibles actualmente en el catálogo.</div>`;
                return;
            }

            contenedorGrid.innerHTML = '';
            productos.forEach(p => {
                const tarjeta = document.createElement('div');
                tarjeta.className = 'tarjeta-producto';
                const stockNum = Number(p.stock) || 0;
                const estadoStock = stockNum > 0 ? 'En Existencia' : 'Agotado';
                const insigniaClase = stockNum > 0 ? 'insignia-oscura' : 'insignia-roja';

                tarjeta.innerHTML = `
                    <div class="imagen-producto-contenedor-principal">
                        <div class="insignias">
                            <span class="insignia ${insigniaClase}">${estadoStock}</span>
                        </div>
                        <div style="height: 150px; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #cbd5e1; background: #f8fafc;">
                            <i class="fas fa-tools"></i>
                        </div>
                    </div>
                    <div class="info-producto">
                        <span class="marca">${p.proveedor_nombre || 'ALMACÉN EL BARATÓN'}</span>
                        <h3 class="titulo-producto"><a href="../detalle_producto/detalle_producto.html?id=${p.id_producto}" style="color: inherit; text-decoration: none;">${p.nombre}</a></h3>
                        <div class="calificacion">
                            <span class="estrellas">★★★★★</span>
                            <span class="resenas">(${stockNum} en stock)</span>
                        </div>
                        <div class="price-contenedor-principal">
                            <span class="precio-actual">${formatearMoneda(p.precio)}</span>
                        </div>
                        <button class="btn-agregar-carrito btn-add-cart-db" data-id="${p.id_producto}" data-sku="${p.sku}" data-precio="${p.precio}" onclick="event.stopPropagation();">
                            <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                        </button>
                    </div>
                `;
                contenedorGrid.appendChild(tarjeta);
            });

            // Conectar botones de Agregar al Carrito
            document.querySelectorAll('.btn-add-cart-db').forEach(btn => {
                btn.addEventListener('click', async function(e) {
                    e.stopPropagation();
                    const id = this.getAttribute('data-id');
                    const sku = this.getAttribute('data-sku');
                    const originalText = this.innerHTML;
                    this.disabled = true;
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                    try {
                        await API.agregarAlCarrito({ id_producto: id, sku }, 1);
                        this.innerHTML = '✓ ¡Agregado!';
                        this.style.background = '#10b981';
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.background = '';
                            this.disabled = false;
                        }, 2000);
                    } catch (err) {
                        alert('Error al agregar al carrito: ' + err.message);
                        this.innerHTML = originalText;
                        this.disabled = false;
                    }
                });
            });

        } catch (error) {
            console.error('Error al cargar catálogo:', error);
            contenedorGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Error al conectar con la base de datos (${error.message}).</div>`;
        }
    }

    // Toggle de filtros
    const filterTitles = document.querySelectorAll('.titulo-filtro');
    filterTitles.forEach(title => {
        title.addEventListener('click', () => {
            const icon = title.querySelector('.icon');
            const options = title.nextElementSibling;
            if (options) {
                if (options.style.display === 'none') {
                    options.style.display = 'flex';
                    if (icon) icon.textContent = '^';
                } else {
                    options.style.display = 'none';
                    if (icon) icon.textContent = 'v';
                }
            }
        });
    });

    await cargarCatalogoDesdeBD();
});
