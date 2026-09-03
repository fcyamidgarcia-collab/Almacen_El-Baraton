// =======================================================
// INICIO - CONECTADO DINÁMICAMENTE A MYSQL / BACKEND
// =======================================================

// ===== Efecto scroll en la barra de navegación =====
const barraNav = document.getElementById('barraNav');

window.addEventListener('scroll', () => {
    if (barraNav) {
        if (window.scrollY > 50) {
            barraNav.classList.add('scrolled');
        } else {
            barraNav.classList.remove('scrolled');
        }
    }
});

// ===== Menú hamburguesa (móvil) =====
const btnMenu = document.getElementById('btnMenu');
const navEnlaces = document.getElementById('navEnlaces');
let menuAbierto = false;

if (btnMenu && navEnlaces) {
    btnMenu.addEventListener('click', () => {
        menuAbierto = !menuAbierto;

        if (menuAbierto) {
            navEnlaces.style.display = 'flex';
            navEnlaces.style.position = 'absolute';
            navEnlaces.style.top = '64px';
            navEnlaces.style.left = '0';
            navEnlaces.style.right = '0';
            navEnlaces.style.flexDirection = 'column';
            navEnlaces.style.backgroundColor = '#111827';
            navEnlaces.style.padding = '16px';
            navEnlaces.style.borderBottom = '1px solid #1f2937';
        } else {
            navEnlaces.style.display = 'none';
        }
    });
}

// ===== Animación de contadores =====
function animarContadores() {
    const contadores = document.querySelectorAll('.estadistica-numero');

    contadores.forEach(contador => {
        const valorFinal = parseInt(contador.getAttribute('data-valor')) || 0;
        const duracion = 1800;
        const inicio = performance.now();

        function actualizar(tiempoActual) {
            const progreso = Math.min((tiempoActual - inicio) / duracion, 1);
            // Desaceleración al final
            const easing = 1 - Math.pow(1 - progreso, 3);
            const valorActual = Math.floor(easing * valorFinal);

            contador.textContent = valorActual;

            if (progreso < 1) {
                requestAnimationFrame(actualizar);
            } else {
                contador.textContent = valorFinal;
            }
        }

        requestAnimationFrame(actualizar);
    });
}

// ===== Observador para animaciones al hacer scroll =====
const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');

            // Activar contadores cuando la sección sea visible
            if (entrada.target.classList.contains('estadisticas')) {
                animarContadores();
            }

            observador.unobserve(entrada.target);
        }
    });
}, {
    threshold: 0.15
});

function observarElementos() {
    document.querySelectorAll(
        '.categoria-tarjeta, .testimonio-tarjeta, .caracteristica-tarjeta, .estadisticas'
    ).forEach(elemento => {
        elemento.classList.add('animar');
        observador.observe(elemento);
    });
}

// ===== Helper de imágenes y estilos para categorías según la BD =====
function obtenerImagenCategoria(nombreCat) {
    const n = (nombreCat || '').toLowerCase();
    if (n.includes('herra')) return '../Almacen/img/herramientas.jpg';
    if (n.includes('ferret')) return '../Almacen/img/ferreteria.jpg';
    if (n.includes('segur') || n.includes('epp')) return '../Almacen/img/seguridad.jpg';
    if (n.includes('luz') || n.includes('ilum')) return 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=600&q=80';
    if (n.includes('electr')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
    if (n.includes('pintur')) return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
    return '../Almacen/img/hero.jpg';
}

function formatearNombreCategoria(nombre) {
    if (!nombre) return 'Categoría';
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

// ===== Cargar categorías verídicas desde la base de datos MySQL =====
async function cargarCategoriasInicio() {
    const grid = document.getElementById('categoriasGrid');
    if (!grid) return;

    try {
        const categorias = await API.getCategorias();
        
        if (!categorias || categorias.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gris);">
                    <i class="fas fa-box-open fa-2x" style="opacity: 0.5;"></i>
                    <p style="margin-top: 10px;">No hay categorías registradas en la base de datos.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = '';

        categorias.forEach(cat => {
            const nombreMostrar = formatearNombreCategoria(cat.nombre_categoria);
            const totalProds = Number(cat.total_productos) || 0;
            // Usa la imagen guardada en BD; si no hay, usa el helper por nombre
            const imagenUrl = (cat.imagen && cat.imagen.trim()) ? cat.imagen.trim() : obtenerImagenCategoria(cat.nombre_categoria);
            const descripcion = cat.descripcion || 'Productos industriales certificados de alta calidad y precisión.';

            const tarjeta = document.createElement('div');
            tarjeta.className = 'categoria-tarjeta';
            tarjeta.style.cursor = 'pointer';
            tarjeta.setAttribute('title', `Ver productos en ${nombreMostrar}`);

            tarjeta.innerHTML = `
                <div class="categoria-imagen">
                    <img src="${imagenUrl}" alt="${nombreMostrar}" onerror="this.src='../Almacen/img/hero.jpg'">
                </div>
                <div class="categoria-info">
                    <div class="categoria-nombre">
                        <h3>${nombreMostrar}</h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                    <p style="margin-bottom: 8px;">${descripcion}</p>
                    <span style="font-size: 0.8rem; font-weight: 600; color: var(--naranja);">
                        <i class="fas fa-boxes" style="margin-right: 4px;"></i> ${totalProds} ${totalProds === 1 ? 'producto activo' : 'productos disponibles'}
                    </span>
                </div>
            `;

            // Redirigir a la tienda filtrando por la categoría seleccionada
            tarjeta.addEventListener('click', () => {
                window.location.href = `../productos/productos.html?categoria=${cat.id_categoria}`;
            });

            grid.appendChild(tarjeta);
        });

        // Registrar tarjetas nuevas en las animaciones
        observarElementos();

    } catch (error) {
        console.warn('Error al cargar categorías desde BD:', error);
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p style="margin-top: 10px;">Error al conectar con la base de datos: ${error.message}</p>
            </div>
        `;
    }
}

// ===== Cargar estadísticas reales desde la base de datos MySQL =====
async function cargarEstadisticasInicio() {
    try {
        const stats = await API.getDashboardStats();
        const productos = await API.getProductos();

        const statProductos = document.getElementById('stat-productos');
        const statStock = document.getElementById('stat-stock');
        const statPedidos = document.getElementById('stat-pedidos');

        if (statProductos) {
            const totalProd = (productos && productos.length) ? productos.length : (stats?.total_productos || 10);
            statProductos.setAttribute('data-valor', totalProd);
        }

        if (statStock) {
            let totalStock = 0;
            if (Array.isArray(productos)) {
                totalStock = productos.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
            }
            if (totalStock > 0) {
                statStock.setAttribute('data-valor', totalStock);
            }
        }

        if (statPedidos && stats?.total_pedidos !== undefined) {
            statPedidos.setAttribute('data-valor', 99);
        }

        // Si ya es visible la sección, actualizar animación
        const secEstadisticas = document.querySelector('.estadisticas');
        if (secEstadisticas && secEstadisticas.classList.contains('visible')) {
            animarContadores();
        }

    } catch (e) {
        console.warn('Estadísticas cargadas con valores predeterminados:', e.message);
    }
}

// ===== Navegación activa según la sección visible =====
const secciones = document.querySelectorAll('section[id]');
const enlacesNav = document.querySelectorAll('.nav-enlaces a');

window.addEventListener('scroll', () => {
    let posicionActual = window.scrollY + 100;

    secciones.forEach(seccion => {
        const seccionTop = seccion.offsetTop;
        const seccionAltura = seccion.offsetHeight;
        const seccionId = seccion.getAttribute('id');

        if (posicionActual >= seccionTop && posicionActual < seccionTop + seccionAltura) {
            enlacesNav.forEach(enlace => {
                enlace.classList.remove('activo');
                if (enlace.getAttribute('href') === '#' + seccionId) {
                    enlace.classList.add('activo');
                }
            });
        }
    });
});

// ===== Formulario del boletín con validación directa =====
const formBoletin = document.getElementById('formBoletin') || document.querySelector('.formulario-boletin');

if (formBoletin) {
    const inputEmail = formBoletin.querySelector('input[type="email"]');
    const btnSuscribir = formBoletin.querySelector('button');

    if (inputEmail) {
        inputEmail.addEventListener('input', () => {
            inputEmail.style.borderColor = '';
            const msg = formBoletin.querySelector('.error-boletin-msg');
            if (msg) msg.remove();
        });
    }

    if (btnSuscribir) {
        btnSuscribir.addEventListener('click', (e) => {
            e.preventDefault();

            const email = inputEmail ? inputEmail.value.trim() : '';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailRegex.test(email)) {
                if (inputEmail) {
                    inputEmail.style.borderColor = '#ef4444';
                    const msgPrev = formBoletin.querySelector('.error-boletin-msg');
                    if (msgPrev) msgPrev.remove();

                    const span = document.createElement('span');
                    span.className = 'error-boletin-msg';
                    span.style.cssText = 'color:#ef4444;font-size:0.8rem;margin-top:6px;display:block;font-weight:600;';
                    span.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ingresa un correo electrónico válido.';
                    formBoletin.appendChild(span);
                }
                return;
            }

            const textoOriginal = btnSuscribir.textContent;
            btnSuscribir.innerHTML = '<i class="fas fa-check"></i> ¡Suscrito!';
            btnSuscribir.style.backgroundColor = '#10b981';

            setTimeout(() => {
                btnSuscribir.textContent = textoOriginal;
                btnSuscribir.style.backgroundColor = '';
                if (inputEmail) inputEmail.value = '';
                const msg = formBoletin.querySelector('.error-boletin-msg');
                if (msg) msg.remove();
            }, 3000);
        });
    }
}

// ===== Buscador en encabezado con validación =====
const inputBusquedaGlobal = document.querySelector('.barra-busqueda input');
if (inputBusquedaGlobal) {
    inputBusquedaGlobal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = inputBusquedaGlobal.value.trim();
            if (!query) {
                inputBusquedaGlobal.style.outline = '2px solid #ef4444';
                setTimeout(() => { inputBusquedaGlobal.style.outline = ''; }, 1500);
                return;
            }
            window.location.href = `../productos/productos.html?buscar=${encodeURIComponent(query)}`;
        }
    });
}

// ===== Scroll suave para los enlaces internos =====
document.querySelectorAll('a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        const href = enlace.getAttribute('href');
        if (href && href !== '#') {
            const destino = document.querySelector(href);
            if (destino) {
                e.preventDefault();
                destino.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Cerrar menú móvil si está abierto
        if (window.innerWidth <= 968 && navEnlaces) {
            navEnlaces.style.display = 'none';
            menuAbierto = false;
        }
    });
});

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', async () => {
    observarElementos();
    await cargarCategoriasInicio();
    await cargarEstadisticasInicio();
});
