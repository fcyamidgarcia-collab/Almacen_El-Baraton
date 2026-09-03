/**
 * BUSCADOR GLOBAL DEL HEADER - Almacen El Baraton / El Baratón
 * Funcionalidad de búsqueda predictiva y navegación en tiempo real para todas las páginas.
 */

(function () {
    'use strict';

    if (window.__buscadorInicializado) return;
    window.__buscadorInicializado = true;

    const API_BASE = window.API_BASE_URL || (window.location.origin.includes(':3000') ? '/api' : 'http://localhost:3000/api');

    function fmtPrecio(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    function iconoCategoria(cat) {
        const c = (cat || '').toLowerCase();
        if (c.includes('herra')) return 'fa-tools';
        if (c.includes('ferret')) return 'fa-hammer';
        if (c.includes('luz') || c.includes('ilum') || c.includes('electr')) return 'fa-bolt';
        if (c.includes('segur') || c.includes('epp')) return 'fa-hard-hat';
        if (c.includes('pint')) return 'fa-paint-brush';
        return 'fa-box';
    }

    function escaparHTML(texto) {
        if (!texto) return '';
        return String(texto)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function resaltarCoincidencia(texto, busqueda) {
        if (!texto || !busqueda) return escaparHTML(texto);
        const limpio = escaparHTML(texto);
        const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return limpio.replace(regex, '<span class="buscador-resaltado">$1</span>');
    }

    // Inyectar estilos modernos y responsivos del buscador
    function inyectarEstilos() {
        if (document.getElementById('buscador-global-estilos')) return;
        const style = document.createElement('style');
        style.id = 'buscador-global-estilos';
        style.textContent = `
            header .barra-busqueda, header .search-bar {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            header .barra-busqueda:focus-within, header .search-bar:focus-within {
                border-color: #f97316 !important;
                box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15) !important;
            }

            header .barra-busqueda .btn-buscar-icono,
            header .search-bar .btn-buscar-icono {
                cursor: pointer;
                transition: color 0.2s ease, transform 0.2s ease;
                padding: 4px;
                color: #64748b;
            }

            header .barra-busqueda .btn-buscar-icono:hover,
            header .search-bar .btn-buscar-icono:hover {
                color: #f97316 !important;
                transform: scale(1.15);
            }

            .btn-limpiar-busqueda {
                display: none;
                cursor: pointer;
                border: none;
                background: #e2e8f0;
                color: #64748b;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                font-size: 11px;
                align-items: center;
                justify-content: center;
                line-height: 1;
                margin-left: 6px;
                transition: all 0.2s ease;
            }

            .btn-limpiar-busqueda:hover {
                background: #cbd5e1;
                color: #0f172a;
            }

            /* Dropdown flotante de sugerencias */
            .buscador-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                left: 0;
                width: 100%;
                min-width: 380px;
                max-width: 480px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14), 0 4px 10px rgba(15, 23, 42, 0.05);
                z-index: 99999;
                overflow: hidden;
                display: none;
                animation: buscadorFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: inherit;
            }

            @keyframes buscadorFadeIn {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .buscador-dropdown-header {
                padding: 10px 14px;
                background: #f8fafc;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.75rem;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .buscador-dropdown-lista {
                max-height: 380px;
                overflow-y: auto;
                overscroll-behavior: contain;
            }

            .buscador-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                cursor: pointer;
                border-bottom: 1px solid #f8fafc;
                transition: background-color 0.15s ease;
                text-decoration: none;
                color: inherit;
            }

            .buscador-item:last-child {
                border-bottom: none;
            }

            .buscador-item:hover, .buscador-item.seleccionado {
                background: #fff7ed;
            }

            .buscador-item-thumb {
                width: 44px;
                height: 44px;
                border-radius: 8px;
                background: #f1f5f9;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                flex-shrink: 0;
                border: 1px solid #e2e8f0;
            }

            .buscador-item-thumb img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .buscador-item-thumb i {
                font-size: 1.25rem;
                color: #94a3b8;
            }

            .buscador-item-info {
                flex: 1;
                min-width: 0;
            }

            .buscador-item-nombre {
                font-size: 0.88rem;
                font-weight: 600;
                color: #1e293b;
                margin: 0 0 3px 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .buscador-item-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.75rem;
                color: #64748b;
            }

            .buscador-badge-cat {
                background: #f1f5f9;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
            }

            .buscador-item-precio {
                text-align: right;
                flex-shrink: 0;
            }

            .buscador-precio-valor {
                font-size: 0.92rem;
                font-weight: 700;
                color: #ea580c;
                display: block;
            }

            .buscador-stock-tag {
                font-size: 0.7rem;
                color: #10b981;
                font-weight: 600;
            }

            .buscador-stock-tag.agotado {
                color: #ef4444;
            }

            .buscador-resaltado {
                background: #fef08a;
                color: #854d0e;
                padding: 0 2px;
                border-radius: 2px;
                font-weight: 700;
            }

            .buscador-dropdown-footer {
                padding: 10px 14px;
                background: #fafaf9;
                border-top: 1px solid #f1f5f9;
                text-align: center;
            }

            .buscador-btn-todos {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                background: linear-gradient(135deg, #f97316, #ea580c);
                color: #ffffff;
                border: none;
                border-radius: 8px;
                padding: 8px 14px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
                text-decoration: none;
            }

            .buscador-btn-todos:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
            }

            .buscador-estado {
                padding: 28px 16px;
                text-align: center;
                color: #64748b;
                font-size: 0.88rem;
            }

            .buscador-estado i {
                font-size: 1.5rem;
                margin-bottom: 8px;
                display: block;
                color: #94a3b8;
            }

            /* Compatibilidad con Modo Oscuro */
            html.dark-mode .buscador-dropdown {
                background: #1e293b !important;
                border-color: #334155 !important;
                box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45) !important;
            }

            html.dark-mode .buscador-dropdown-header {
                background: #0f172a !important;
                border-color: #334155 !important;
                color: #94a3b8 !important;
            }

            html.dark-mode .buscador-item {
                border-color: #334155 !important;
                color: #f1f5f9 !important;
            }

            html.dark-mode .buscador-item:hover,
            html.dark-mode .buscador-item.seleccionado {
                background: rgba(249, 115, 22, 0.15) !important;
            }

            html.dark-mode .buscador-item-nombre {
                color: #f8fafc !important;
            }

            html.dark-mode .buscador-item-thumb {
                background: #0f172a !important;
                border-color: #334155 !important;
            }

            html.dark-mode .buscador-badge-cat {
                background: #334155 !important;
                color: #cbd5e1 !important;
            }

            html.dark-mode .buscador-resaltado {
                background: #854d0e !important;
                color: #fef08a !important;
            }

            html.dark-mode .buscador-dropdown-footer {
                background: #0f172a !important;
                border-color: #334155 !important;
            }

            html.dark-mode .btn-limpiar-busqueda {
                background: #334155;
                color: #cbd5e1;
            }

            html.dark-mode .btn-limpiar-busqueda:hover {
                background: #475569;
                color: #ffffff;
            }

            @media (max-width: 640px) {
                .buscador-dropdown {
                    min-width: 100vw;
                    position: fixed;
                    left: 0;
                    top: 60px;
                    border-radius: 0 0 16px 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Inicialización del buscador
    function inicializarBuscador() {
        const contenedor = document.querySelector('header .barra-busqueda, header .search-bar');
        if (!contenedor) return;

        const input = contenedor.querySelector('input');
        if (!input) return;

        inyectarEstilos();

        // Identificar si estamos en la página de catálogo de productos
        const rutaActual = window.location.pathname.replace(/\\/g, '/');
        const esPaginaProductos = rutaActual.includes('/productos/productos.html') || rutaActual.endsWith('/productos.html');

        // Configurar botón icono de búsqueda
        const icono = contenedor.querySelector('i.fa-search');
        if (icono) {
            icono.classList.add('btn-buscar-icono');
            icono.setAttribute('title', 'Buscar inventario');
            icono.setAttribute('role', 'button');
            icono.setAttribute('tabindex', '0');
        }

        // Botón limpiar input
        let btnLimpiar = contenedor.querySelector('.btn-limpiar-busqueda');
        if (!btnLimpiar) {
            btnLimpiar = document.createElement('button');
            btnLimpiar.type = 'button';
            btnLimpiar.className = 'btn-limpiar-busqueda';
            btnLimpiar.setAttribute('aria-label', 'Limpiar búsqueda');
            btnLimpiar.innerHTML = '&times;';
            contenedor.appendChild(btnLimpiar);
        }

        // Crear contenedor dropdown de sugerencias
        let dropdown = contenedor.querySelector('.buscador-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'buscador-dropdown';
            dropdown.setAttribute('role', 'listbox');
            dropdown.innerHTML = `
                <div class="buscador-dropdown-header">
                    <span>Resultados Rápidos</span>
                    <span class="buscador-contador-header"></span>
                </div>
                <div class="buscador-dropdown-lista"></div>
                <div class="buscador-dropdown-footer"></div>
            `;
            contenedor.appendChild(dropdown);
        }

        const listaEl = dropdown.querySelector('.buscador-dropdown-lista');
        const contadorHeader = dropdown.querySelector('.buscador-contador-header');
        const footerEl = dropdown.querySelector('.buscador-dropdown-footer');

        let debounceTimer = null;
        let abortController = null;
        let itemsSugeridos = [];
        let indiceSeleccionado = -1;

        function sincronizarBotonLimpiar() {
            if (input.value.trim().length > 0) {
                btnLimpiar.style.display = 'inline-flex';
            } else {
                btnLimpiar.style.display = 'none';
            }
        }

        function cerrarDropdown() {
            dropdown.style.display = 'none';
            indiceSeleccionado = -1;
        }

        function abrirDropdown() {
            if (itemsSugeridos.length > 0 || listaEl.innerHTML.trim() !== '') {
                dropdown.style.display = 'block';
            }
        }

        // Ejecutar búsqueda (Enter o clic en lupa)
        function ejecutarBusqueda() {
            const query = input.value.trim();
            cerrarDropdown();

            if (esPaginaProductos) {
                // Si ya estamos en productos.html, actualizar filtro
                input.dispatchEvent(new Event('input', { bubbles: true }));
                const url = new URL(window.location);
                if (query) {
                    url.searchParams.set('buscar', query);
                } else {
                    url.searchParams.delete('buscar');
                    url.searchParams.delete('q');
                }
                window.history.replaceState({}, '', url);

                // Scroll suave hacia los productos
                const mainGrid = document.querySelector('.cuadricula-productos') || document.querySelector('.contenedor-principal');
                if (mainGrid) {
                    mainGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // Redirigir a productos.html con el término de búsqueda
                const urlDestino = query
                    ? `../productos/productos.html?buscar=${encodeURIComponent(query)}`
                    : `../productos/productos.html`;
                window.location.href = urlDestino;
            }
        }

        // Buscar productos en el backend
        async function buscarEnBackend(query) {
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();

            dropdown.style.display = 'block';
            listaEl.innerHTML = `
                <div class="buscador-estado">
                    <i class="fas fa-spinner fa-spin"></i>
                    Buscando "${escaparHTML(query)}"...
                </div>
            `;
            footerEl.innerHTML = '';
            contadorHeader.textContent = '';

            try {
                const url = `${API_BASE}/productos?buscar=${encodeURIComponent(query)}`;
                const res = await fetch(url, { signal: abortController.signal });
                if (!res.ok) throw new Error('Error al consultar productos');
                const productos = await res.json();

                renderizarResultados(productos, query);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.warn('[Buscador Global] Error:', err.message);
                listaEl.innerHTML = `
                    <div class="buscador-estado" style="color:#ef4444">
                        <i class="fas fa-exclamation-triangle"></i>
                        No se pudo conectar con el catálogo.
                    </div>
                `;
            }
        }

        // Renderizar sugerencias en el dropdown
        function renderizarResultados(productos, query) {
            itemsSugeridos = productos || [];
            indiceSeleccionado = -1;

            if (itemsSugeridos.length === 0) {
                contadorHeader.textContent = '0 encontrados';
                listaEl.innerHTML = `
                    <div class="buscador-estado">
                        <i class="fas fa-search"></i>
                        No encontramos productos para "<strong>${escaparHTML(query)}</strong>"
                    </div>
                `;
                footerEl.innerHTML = `
                    <a href="../productos/productos.html" class="buscador-btn-todos" style="background:#64748b">
                        <i class="fas fa-th-large"></i> Ver todo el catálogo
                    </a>
                `;
                return;
            }

            contadorHeader.textContent = `${itemsSugeridos.length} resultado${itemsSugeridos.length === 1 ? '' : 's'}`;

            // Mostrar hasta 6 resultados en el dropdown
            const mostrados = itemsSugeridos.slice(0, 6);
            listaEl.innerHTML = '';

            mostrados.forEach((p, idx) => {
                const stock = Number(p.stock) || 0;
                const agotado = stock <= 0;
                const iconoCat = iconoCategoria(p.nombre_categoria);

                let imagenHTML = `<i class="fas ${iconoCat}"></i>`;
                if (p.imagen) {
                    imagenHTML = `
                        <img src="${p.imagen}" alt="${escaparHTML(p.nombre_producto)}"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                        <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center">
                            <i class="fas ${iconoCat}"></i>
                        </div>
                    `;
                }

                const itemLink = document.createElement('a');
                itemLink.className = 'buscador-item';
                itemLink.setAttribute('role', 'option');
                itemLink.setAttribute('data-id', p.id_producto);
                itemLink.setAttribute('data-index', idx);
                itemLink.href = `../detalle_producto/detalle_producto.html?id=${p.id_producto}`;

                itemLink.innerHTML = `
                    <div class="buscador-item-thumb">
                        ${imagenHTML}
                    </div>
                    <div class="buscador-item-info">
                        <h4 class="buscador-item-nombre">${resaltarCoincidencia(p.nombre_producto, query)}</h4>
                        <div class="buscador-item-meta">
                            <span class="buscador-badge-cat">${escaparHTML(p.nombre_categoria || 'General')}</span>
                            ${p.nombre_proveedor ? `<span>• ${escaparHTML(p.nombre_proveedor)}</span>` : ''}
                        </div>
                    </div>
                    <div class="buscador-item-precio">
                        <span class="buscador-precio-valor">${fmtPrecio(p.precio)}</span>
                        <span class="buscador-stock-tag ${agotado ? 'agotado' : ''}">
                            ${agotado ? 'Agotado' : `${stock} disp.`}
                        </span>
                    </div>
                `;

                itemLink.addEventListener('click', (e) => {
                    cerrarDropdown();
                });

                listaEl.appendChild(itemLink);
            });

            // Botón footer: Ver todos los resultados
            footerEl.innerHTML = `
                <a href="../productos/productos.html?buscar=${encodeURIComponent(query)}" class="buscador-btn-todos" id="btn-ver-todos-buscar">
                    <i class="fas fa-search"></i> Ver todos los resultados (${itemsSugeridos.length})
                </a>
            `;

            const btnVerTodos = footerEl.querySelector('#btn-ver-todos-buscar');
            if (btnVerTodos && esPaginaProductos) {
                btnVerTodos.addEventListener('click', (e) => {
                    e.preventDefault();
                    ejecutarBusqueda();
                });
            }
        }

        // Navegación con flechas del teclado
        function actualizarSeleccionTeclado(nuevoIndice) {
            const elementos = listaEl.querySelectorAll('.buscador-item');
            if (elementos.length === 0) return;

            elementos.forEach(el => el.classList.remove('seleccionado'));

            if (nuevoIndice < 0) nuevoIndice = elementos.length - 1;
            if (nuevoIndice >= elementos.length) nuevoIndice = 0;

            indiceSeleccionado = nuevoIndice;
            const actual = elementos[indiceSeleccionado];
            if (actual) {
                actual.classList.add('seleccionado');
                actual.scrollIntoView({ block: 'nearest' });
            }
        }

        // Eventos de entrada
        input.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            sincronizarBotonLimpiar();

            clearTimeout(debounceTimer);

            if (val.length < 2) {
                cerrarDropdown();
                itemsSugeridos = [];
                return;
            }

            debounceTimer = setTimeout(() => {
                buscarEnBackend(val);
            }, 220);
        });

        // Eventos de teclado
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                if (dropdown.style.display === 'none') {
                    if (input.value.trim().length >= 2) buscarEnBackend(input.value.trim());
                } else {
                    e.preventDefault();
                    actualizarSeleccionTeclado(indiceSeleccionado + 1);
                }
            } else if (e.key === 'ArrowUp') {
                if (dropdown.style.display !== 'none') {
                    e.preventDefault();
                    actualizarSeleccionTeclado(indiceSeleccionado - 1);
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const seleccion = listaEl.querySelector('.buscador-item.seleccionado');
                if (seleccion && dropdown.style.display !== 'none') {
                    seleccion.click();
                } else {
                    ejecutarBusqueda();
                }
            } else if (e.key === 'Escape') {
                cerrarDropdown();
            }
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2 && itemsSugeridos.length > 0) {
                abrirDropdown();
            }
        });

        // Clic en la lupa
        if (icono) {
            icono.addEventListener('click', (e) => {
                e.preventDefault();
                ejecutarBusqueda();
            });
            icono.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    ejecutarBusqueda();
                }
            });
        }

        // Clic en botón limpiar
        btnLimpiar.addEventListener('click', (e) => {
            e.preventDefault();
            input.value = '';
            sincronizarBotonLimpiar();
            cerrarDropdown();
            input.focus();

            if (esPaginaProductos) {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                const url = new URL(window.location);
                url.searchParams.delete('buscar');
                url.searchParams.delete('q');
                window.history.replaceState({}, '', url);
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!contenedor.contains(e.target)) {
                cerrarDropdown();
            }
        });

        // Sincronización inicial
        sincronizarBotonLimpiar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarBuscador);
    } else {
        inicializarBuscador();
    }
})();
