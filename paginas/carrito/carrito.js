/**
 * Lógica para la página del Carrito de Compras - Conectado a MySQL
 */

document.addEventListener('DOMContentLoaded', async () => {
    const contenedorProductos = document.querySelector('.carrito-productos');
    const filasResumen = document.querySelector('.resumen-filas');
    const totalValor = document.querySelector('.total-valor');

    function formatearMoneda(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    async function cargarCarrito() {
        if (!contenedorProductos) return;

        try {
            const data = await API.getCarrito();
            
            // Guardar cabecera
            const cabeceraHTML = `
                <div class="productos-cabecera">
                    <div class="col-producto">PRODUCTO</div>
                    <div class="col-cantidad">CANTIDAD</div>
                    <div class="col-precio">PRECIO UNITARIO</div>
                    <div class="col-subtotal">SUBTOTAL</div>
                </div>
            `;

            if (!data.items || data.items.length === 0) {
                contenedorProductos.innerHTML = cabeceraHTML + `
                    <div style="padding: 40px; text-align: center; color: #64748b;">
                        <i class="fas fa-shopping-cart fa-3x" style="color: #cbd5e1; margin-bottom: 15px;"></i>
                        <p>Tu carrito de compras está vacío.</p>
                        <a href="../productos/productos.html" style="display: inline-block; margin-top: 15px; color: #ea580c; font-weight: 600;">Ver Catálogo de Productos →</a>
                    </div>
                `;
                if (filasResumen) {
                    filasResumen.innerHTML = `
                        <div class="resumen-fila"><span>Subtotal (0 artículos)</span><span>$ 0</span></div>
                        <div class="resumen-fila"><span>Impuestos (IVA 19%)</span><span>$ 0</span></div>
                        <div class="resumen-fila"><span>Envío Estimado</span><span class="texto-gratis">Gratis</span></div>
                    `;
                }
                if (totalValor) totalValor.textContent = '$ 0';
                return;
            }

            let itemsHTML = cabeceraHTML;
            data.items.forEach(item => {
                itemsHTML += `
                    <div class="producto-item">
                        <div class="col-producto info-producto">
                            <div class="producto-img" style="display: flex; align-items: center; justify-content: center; background: #f8fafc; font-size: 1.8rem; color: #94a3b8;">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="producto-detalles">
                                <span class="marca-badge">ALMACÉN EL BARATÓN</span>
                                <h3>${item.nombre}</h3>
                                <span class="producto-sku">SKU: ${item.sku}</span>
                                <button class="btn-eliminar-item" data-id="${item.id_detalle}" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; padding: 0; margin-top: 5px; text-align: left;">
                                    <i class="fas fa-trash-alt"></i> Eliminar
                                </button>
                            </div>
                        </div>
                        <div class="col-cantidad">
                            <div class="control-cantidad">
                                <input type="number" value="${item.cantidad}" min="1" readonly style="width: 50px; text-align: center; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px;">
                            </div>
                        </div>
                        <div class="col-precio precio-valor">${formatearMoneda(item.precio)}</div>
                        <div class="col-subtotal subtotal-valor">${formatearMoneda(item.subtotal)}</div>
                    </div>
                `;
            });

            contenedorProductos.innerHTML = itemsHTML;

            // Actualizar resumen
            if (filasResumen) {
                filasResumen.innerHTML = `
                    <div class="resumen-fila">
                        <span>Subtotal (${data.items.length} artículos)</span>
                        <span>${formatearMoneda(data.subtotal)}</span>
                    </div>
                    <div class="resumen-fila">
                        <span>Impuestos (IVA 19%)</span>
                        <span>${formatearMoneda(data.iva)}</span>
                    </div>
                    <div class="resumen-fila">
                        <span>Envío Estimado</span>
                        <span class="texto-gratis">Gratis</span>
                    </div>
                `;
            }

            if (totalValor) {
                totalValor.textContent = formatearMoneda(data.total);
            }

            // Eventos para eliminar items
            document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    try {
                        await API.eliminarItemCarrito(id);
                        await cargarCarrito();
                    } catch (err) {
                        alert('Error al eliminar item: ' + err.message);
                    }
                });
            });

        } catch (error) {
            console.error('Error al cargar carrito:', error);
        }
    }

    // Efecto scroll en nav
    const nav = document.getElementById('barraNav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });
    }

    await cargarCarrito();
});
