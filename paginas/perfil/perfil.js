// ========== PERFIL JS (CONECTADO A MYSQL) ==========

document.addEventListener('DOMContentLoaded', async () => {
    function fmt(val) {
        return '$ ' + Number(val || 0).toLocaleString('es-CO');
    }

    // --- Navbar scroll effect ---
    const barraNav = document.getElementById('barraNav');
    if (barraNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) barraNav.classList.add('scrolled');
            else barraNav.classList.remove('scrolled');
        });
    }

    // --- Menú hamburguesa (Mobile) ---
    const btnMenu = document.getElementById('btnMenu');
    const navEnlaces = document.getElementById('navEnlaces');
    if (btnMenu && navEnlaces) {
        btnMenu.addEventListener('click', () => {
            navEnlaces.classList.toggle('nav-abierto');
            btnMenu.classList.toggle('activo');
        });
    }

    // --- Cargar datos del usuario desde MySQL / Sesión ---
    let usuario = API.getUsuarioActual();
    if (!usuario) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = '../sesion/index.html';
        return;
    }

    let clienteData = null;

    // Cargar información completa del cliente desde la base de datos
    async function cargarInfoUsuario() {
        try {
            const perfilDB = await API.request(`/auth/perfil/${usuario.id_usuario}`);
            if (perfilDB) {
                usuario = { ...usuario, ...perfilDB };
                localStorage.setItem('baraton_user', JSON.stringify(usuario));
            }
        } catch (_) {}

        try {
            clienteData = await API.getClientePorUsuario(usuario.id_usuario);
        } catch (_) {}

        // 1. Avatar inicial y nombre de encabezado
        const inicial = (usuario.nombre || usuario.correo || 'U').charAt(0).toUpperCase();
        const elAvatar = document.getElementById('perfil-avatar-inicial');
        if (elAvatar) elAvatar.textContent = inicial;

        const elNombreHeader = document.getElementById('perfil-nombre-header');
        const elRolHeader = document.getElementById('perfil-rol-header');
        const elIdHeader = document.getElementById('perfil-id-header');

        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.correo;
        if (elNombreHeader) elNombreHeader.textContent = nombreCompleto;
        if (elRolHeader) elRolHeader.textContent = `${usuario.email || usuario.correo} • Rol: ${usuario.rol_nombre || usuario.nombre_rol || usuario.rol || 'Cliente'}`;
        if (elIdHeader) elIdHeader.textContent = `ID Usuario: #${usuario.id_usuario}${clienteData?.id_cliente ? ` | ID Cliente: #${clienteData.id_cliente}` : ''}`;

        // 2. Tarjeta de contacto y facturación
        const elTipoDoc = document.getElementById('perfil-tipo-documento');
        const elDoc = document.getElementById('perfil-documento');
        const elTel = document.getElementById('perfil-telefono');
        const elDir = document.getElementById('perfil-direccion');
        const elCiu = document.getElementById('perfil-ciudad');

        let rawDoc = clienteData?.documento_identidad || usuario?.documento_identidad || '';
        let tipoDocDetectado = clienteData?.tipo_documento || usuario?.tipo_documento || 'CC';
        let numDocLimpio = rawDoc;
        if (rawDoc && rawDoc.includes(':')) {
            const partes = rawDoc.split(':');
            tipoDocDetectado = partes[0].trim().toUpperCase();
            numDocLimpio = partes.slice(1).join(':').trim();
        }

        if (elTipoDoc) elTipoDoc.textContent = tipoDocDetectado;
        if (elDoc) elDoc.textContent = numDocLimpio || 'No registrado';
        if (elTel) elTel.textContent = clienteData?.telefono || usuario.telefono || 'No registrado';
        if (elDir) elDir.textContent = clienteData?.direccion || usuario.direccion || 'No registrada';
        if (elCiu) elCiu.textContent = clienteData?.ciudad || 'Bogotá D.C.';

        // 3. Pestaña de direcciones
        const dirTextoTab = document.getElementById('direccion-texto-tab');
        if (dirTextoTab) {
            if (clienteData?.direccion) {
                dirTextoTab.innerHTML = `
                    <strong>${nombreCompleto}</strong><br>
                    ${clienteData.direccion}<br>
                    ${clienteData.ciudad || 'Bogotá D.C.'}<br>
                    Tel: ${clienteData.telefono || 'No registrado'}
                `;
            } else {
                dirTextoTab.innerHTML = '<em>No tienes una dirección de entrega configurada aún. Haz clic en "Actualizar Dirección" para registrar una.</em>';
            }
        }
    }

    // --- Lógica de Pedidos del Usuario ---
    async function cargarPedidosUsuario() {
        const contenedorResumen = document.getElementById('lista-pedidos-resumen');
        const contenedorCompleto = document.getElementById('contenedor-pedidos-completo');

        try {
            const pedidos = await API.getPedidos({ id_usuario: usuario.id_usuario });

            if (!pedidos || pedidos.length === 0) {
                if (contenedorResumen) {
                    contenedorResumen.innerHTML = `
                        <div style="padding: 24px; text-align: center; color: var(--texto-secundario);">
                            <i class="fas fa-box-open fa-2x" style="color: var(--gris); margin-bottom: 8px;"></i>
                            <p>No tienes pedidos recientes.</p>
                            <a href="../productos/productos.html" style="color: var(--naranja); font-weight: 600; font-size: 0.9rem;">Explorar Tienda →</a>
                        </div>
                    `;
                }
                if (contenedorCompleto) {
                    contenedorCompleto.innerHTML = `
                        <div class="tarjeta-seccion mt-24" style="padding: 40px; text-align: center;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--gris)" stroke-width="1.5" width="48" height="48" style="margin: 0 auto 16px;">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            </svg>
                            <h3 style="margin-bottom: 8px;">Aún no has realizado pedidos</h3>
                            <p style="color: var(--texto-secundario); max-width: 400px; margin: 0 auto;">Tus pedidos confirmados aparecerán aquí con su estado en tiempo real y detalles de entrega.</p>
                            <a href="../productos/productos.html" class="btn-outline" style="display: inline-block; margin-top: 16px;">Ir a la Tienda</a>
                        </div>
                    `;
                }
                return;
            }

            function obtenerBadge(estado) {
                const e = (estado || 'pendiente').toLowerCase();
                if (e.includes('entreg') || e.includes('complet')) {
                    return `<span class="tag tag-enviado" style="background:#ecfdf5;color:#059669"><i class="fas fa-check-circle"></i> Entregado</span>`;
                }
                if (e.includes('envi')) {
                    return `<span class="tag tag-enviado"><i class="fas fa-truck"></i> Enviado</span>`;
                }
                if (e.includes('proces')) {
                    return `<span class="tag tag-pendiente" style="background:#eff6ff;color:#2563eb"><i class="fas fa-cog fa-spin"></i> En Proceso</span>`;
                }
                if (e.includes('cancel')) {
                    return `<span class="tag tag-pendiente" style="background:#fee2e2;color:#ef4444"><i class="fas fa-times-circle"></i> Cancelado</span>`;
                }
                return `<span class="tag tag-pendiente"><i class="fas fa-clock"></i> Pendiente</span>`;
            }

            // Resumen (primeros 3 pedidos)
            if (contenedorResumen) {
                contenedorResumen.innerHTML = '';
                pedidos.slice(0, 3).forEach(p => {
                    const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
                    const primerItem = p.items && p.items.length > 0 ? p.items[0].nombre_producto : 'Productos Varios';
                    const itemsExtra = p.items && p.items.length > 1 ? ` y ${p.items.length - 1} más` : '';

                    const div = document.createElement('div');
                    div.className = 'pedido-item';
                    div.style.cursor = 'pointer';
                    div.onclick = () => window.location.href = `../confirmacion/confirmacion.html?pedido=${p.id_pedido}`;
                    div.innerHTML = `
                        <div class="pedido-icono">
                            <i class="fas fa-box" style="font-size: 1.2rem;"></i>
                        </div>
                        <div class="pedido-info">
                            <h4>Pedido #ORD-${p.id_pedido}</h4>
                            <p>${primerItem}${itemsExtra} • <span style="font-size: 0.8rem; opacity: 0.8;">${fecha}</span></p>
                        </div>
                        <div class="pedido-estado">
                            <span class="precio">${fmt(p.total)}</span>
                            ${obtenerBadge(p.estado_pedido)}
                        </div>
                    `;
                    contenedorResumen.appendChild(div);
                });
            }

            // Pestaña Mis Pedidos completa
            if (contenedorCompleto) {
                let html = '<div class="tarjeta-seccion mt-24" style="padding: 0; overflow: hidden;"><div class="lista-pedidos">';
                pedidos.forEach(p => {
                    const fecha = new Date(p.fecha_pedido).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
                    const itemsList = (p.items || []).map(i => `${i.cantidad}x ${i.nombre_producto}`).join(', ') || 'Sin detalle';

                    html += `
                        <div class="pedido-item" style="border-bottom: 1px solid var(--gris-borde); padding: 18px 24px; cursor: pointer;" onclick="window.location.href='../confirmacion/confirmacion.html?pedido=${p.id_pedido}'">
                            <div class="pedido-icono">
                                <i class="fas fa-receipt" style="font-size: 1.3rem;"></i>
                            </div>
                            <div class="pedido-info" style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <h4 style="margin: 0;">Pedido #ORD-${p.id_pedido}</h4>
                                    <span style="font-size: 0.8rem; color: var(--texto-secundario);">${fecha}</span>
                                </div>
                                <p style="margin-top: 4px; font-size: 0.85rem; color: var(--texto-secundario);">${itemsList}</p>
                                <p style="font-size: 0.8rem; color: var(--texto-secundario);"><i class="fas fa-map-marker-alt"></i> ${p.direccion_entrega || 'Dirección no registrada'}</p>
                            </div>
                            <div class="pedido-estado" style="text-align: right;">
                                <span class="precio" style="font-size: 1.1rem; display: block; margin-bottom: 6px;">${fmt(p.total)}</span>
                                ${obtenerBadge(p.estado_pedido)}
                            </div>
                        </div>
                    `;
                });
                html += '</div></div>';
                contenedorCompleto.innerHTML = html;
            }

        } catch (e) {
            console.error('Error cargando pedidos:', e);
            if (contenedorResumen) {
                contenedorResumen.innerHTML = `<div style="padding: 20px; text-align: center; color: #ef4444;"><i class="fas fa-exclamation-circle"></i> Error al conectar con la base de datos (${e.message}).</div>`;
            }
        }
    }

    // --- MODAL: EDITAR PERFIL ---
    const modalPerfil = document.getElementById('modal-editar-perfil');
    const btnAbrirPerfil = document.getElementById('btn-abrir-editar-perfil');
    const btnCerrarPerfil = document.getElementById('btn-cerrar-modal-perfil');
    const btnCancelarPerfil = document.getElementById('btn-cancelar-perfil');
    const formPerfil = document.getElementById('form-editar-perfil');

    const btnAbrirDir1 = document.getElementById('btn-agregar-direccion');
    const btnAbrirDir2 = document.getElementById('btn-editar-dir-tab');

    function abrirModalPerfil() {
        if (!modalPerfil) return;
        document.getElementById('edit-nombre').value = usuario.nombre || '';
        document.getElementById('edit-apellido').value = usuario.apellido || '';

        let rawDoc = clienteData?.documento_identidad || usuario?.documento_identidad || '';
        let tipoDocDetectado = clienteData?.tipo_documento || usuario?.tipo_documento || 'CC';
        let numDocLimpio = rawDoc;
        if (rawDoc && rawDoc.includes(':')) {
            const partes = rawDoc.split(':');
            tipoDocDetectado = partes[0].trim().toUpperCase();
            numDocLimpio = partes.slice(1).join(':').trim();
        }

        const selTipo = document.getElementById('edit-tipo-doc');
        if (selTipo) selTipo.value = tipoDocDetectado || 'CC';
        document.getElementById('edit-documento').value = numDocLimpio || '';
        document.getElementById('edit-telefono').value = clienteData?.telefono || usuario.telefono || '';
        document.getElementById('edit-direccion').value = clienteData?.direccion || usuario.direccion || '';
        document.getElementById('edit-ciudad').value = clienteData?.ciudad || 'Bogotá D.C.';
        modalPerfil.style.display = 'flex';
    }

    function cerrarModalPerfil() {
        if (modalPerfil) modalPerfil.style.display = 'none';
    }

    if (btnAbrirPerfil) btnAbrirPerfil.addEventListener('click', abrirModalPerfil);
    if (btnAbrirDir1) btnAbrirDir1.addEventListener('click', abrirModalPerfil);
    if (btnAbrirDir2) btnAbrirDir2.addEventListener('click', abrirModalPerfil);
    if (btnCerrarPerfil) btnCerrarPerfil.addEventListener('click', cerrarModalPerfil);
    if (btnCancelarPerfil) btnCancelarPerfil.addEventListener('click', cerrarModalPerfil);

    // Helpers de error para modales de perfil
    function mostrarErrorModal(input, mensaje) {
        limpiarErrorModal(input);
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        const span = document.createElement('span');
        span.className = 'error-modal-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:flex;align-items:center;gap:4px;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorModal(input) {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        const siguiente = input.nextElementSibling;
        if (siguiente && siguiente.classList.contains('error-modal-msg')) {
            siguiente.remove();
        }
    }

    // Limpieza al escribir en los inputs de perfil
    ['edit-nombre', 'edit-apellido', 'edit-documento', 'edit-telefono', 'edit-direccion', 'edit-ciudad', 'pass-actual', 'pass-nueva', 'pass-confirmar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => limpiarErrorModal(el));
    });

    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputNombre = document.getElementById('edit-nombre');
            const inputApellido = document.getElementById('edit-apellido');
            const selectTipoDoc = document.getElementById('edit-tipo-doc');
            const inputDocumento = document.getElementById('edit-documento');
            const inputTelefono = document.getElementById('edit-telefono');
            const inputDireccion = document.getElementById('edit-direccion');
            const inputCiudad = document.getElementById('edit-ciudad');

            const nombre = inputNombre?.value.trim() || '';
            const apellido = inputApellido?.value.trim() || '';
            const tipoDoc = selectTipoDoc?.value || 'CC';
            const doc = inputDocumento?.value.trim() || '';
            const tel = inputTelefono?.value.trim() || '';
            const dir = inputDireccion?.value.trim() || '';
            const ciu = inputCiudad?.value.trim() || '';

            const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;
            let esValido = true;

            if (!nombre || nombre.length < 2) {
                mostrarErrorModal(inputNombre, 'El nombre debe tener al menos 2 caracteres.');
                esValido = false;
            } else {
                limpiarErrorModal(inputNombre);
            }

            if (!apellido || apellido.length < 2) {
                mostrarErrorModal(inputApellido, 'El apellido debe tener al menos 2 caracteres.');
                esValido = false;
            } else {
                limpiarErrorModal(inputApellido);
            }

            if (doc && doc.length < 5) {
                mostrarErrorModal(inputDocumento, 'El documento debe tener al menos 5 caracteres.');
                esValido = false;
            } else if (inputDocumento) {
                limpiarErrorModal(inputDocumento);
            }

            if (tel && !telefonoRegex.test(tel)) {
                mostrarErrorModal(inputTelefono, 'Número de teléfono inválido (mínimo 7 dígitos).');
                esValido = false;
            } else if (inputTelefono) {
                limpiarErrorModal(inputTelefono);
            }

            if (dir && dir.length < 5) {
                mostrarErrorModal(inputDireccion, 'La dirección debe ser más descriptiva.');
                esValido = false;
            } else if (inputDireccion) {
                limpiarErrorModal(inputDireccion);
            }

            if (ciu && ciu.length < 3) {
                mostrarErrorModal(inputCiudad, 'Nombre de ciudad inválido.');
                esValido = false;
            } else if (inputCiudad) {
                limpiarErrorModal(inputCiudad);
            }

            if (!esValido) return;

            const btnGuardar = document.getElementById('btn-guardar-perfil');
            const originalHTML = btnGuardar.innerHTML;

            const datos = {
                nombre,
                apellido,
                tipo_documento: tipoDoc,
                documento_identidad: doc ? `${tipoDoc}: ${doc}` : '',
                numero_documento: doc,
                telefono: tel,
                direccion: dir,
                ciudad: ciu
            };

            try {
                btnGuardar.disabled = true;
                btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando en BD...';

                await API.actualizarPerfil(usuario.id_usuario, datos);
                alert('¡Tus datos han sido actualizados exitosamente en la base de datos!');
                cerrarModalPerfil();
                await cargarInfoUsuario();
            } catch (err) {
                alert('Error al actualizar datos: ' + err.message);
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalHTML;
            }
        });
    }

    // --- MODAL: CAMBIAR CONTRASEÑA ---
    const modalPassword = document.getElementById('modal-cambiar-contrasena');
    const btnAbrirPassword = document.getElementById('btn-abrir-cambiar-contrasena');
    const btnCerrarPassword = document.getElementById('btn-cerrar-modal-password');
    const btnCancelarPassword = document.getElementById('btn-cancelar-password');
    const formPassword = document.getElementById('form-cambiar-contrasena');

    function abrirModalPassword() {
        if (modalPassword) {
            formPassword.reset();
            modalPassword.style.display = 'flex';
        }
    }

    function cerrarModalPassword() {
        if (modalPassword) modalPassword.style.display = 'none';
    }

    if (btnAbrirPassword) btnAbrirPassword.addEventListener('click', abrirModalPassword);
    if (btnCerrarPassword) btnCerrarPassword.addEventListener('click', cerrarModalPassword);
    if (btnCancelarPassword) btnCancelarPassword.addEventListener('click', cerrarModalPassword);

    if (formPassword) {
        formPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputActual = document.getElementById('pass-actual');
            const inputNueva = document.getElementById('pass-nueva');
            const inputConfirmar = document.getElementById('pass-confirmar');

            const actualPassword = inputActual ? inputActual.value : '';
            const nuevaPassword = inputNueva ? inputNueva.value : '';
            const confirmarPassword = inputConfirmar ? inputConfirmar.value : '';

            let passValido = true;

            if (!actualPassword) {
                mostrarErrorModal(inputActual, 'Ingresa tu contraseña actual.');
                passValido = false;
            } else {
                limpiarErrorModal(inputActual);
            }

            if (!nuevaPassword) {
                mostrarErrorModal(inputNueva, 'Ingresa la nueva contraseña.');
                passValido = false;
            } else if (nuevaPassword.length < 6) {
                mostrarErrorModal(inputNueva, 'La nueva contraseña debe tener al menos 6 caracteres.');
                passValido = false;
            } else if (actualPassword && nuevaPassword === actualPassword) {
                mostrarErrorModal(inputNueva, 'La nueva contraseña no puede ser idéntica a la actual.');
                passValido = false;
            } else {
                limpiarErrorModal(inputNueva);
            }

            if (!confirmarPassword) {
                mostrarErrorModal(inputConfirmar, 'Confirma tu nueva contraseña.');
                passValido = false;
            } else if (nuevaPassword !== confirmarPassword) {
                mostrarErrorModal(inputConfirmar, 'Las contraseñas no coinciden.');
                passValido = false;
            } else {
                limpiarErrorModal(inputConfirmar);
            }

            if (!passValido) return;

            const btnSubmit = document.getElementById('btn-guardar-password');
            const originalHTML = btnSubmit.innerHTML;

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

                await API.cambiarContrasena(usuario.id_usuario, actualPassword, nuevaPassword);
                alert('¡Contraseña actualizada exitosamente en la base de datos!');
                cerrarModalPassword();
            } catch (err) {
                alert('Error al cambiar contraseña: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    // --- GUARDAR PREFERENCIAS (CONFIGURACIÓN) ---
    const btnGuardarPref = document.getElementById('btn-guardar-preferencias');
    if (btnGuardarPref) {
        // Cargar preferencias previas si existen
        const pref = JSON.parse(localStorage.getItem('perfil_preferencias') || '{}');
        if (pref.promo !== undefined) document.getElementById('check-promo').checked = pref.promo;
        if (pref.notif !== undefined) document.getElementById('check-pedidos-notif').checked = pref.notif;

        btnGuardarPref.addEventListener('click', () => {
            const promo = document.getElementById('check-promo').checked;
            const notif = document.getElementById('check-pedidos-notif').checked;
            localStorage.setItem('perfil_preferencias', JSON.stringify({ promo, notif }));

            const originalHTML = btnGuardarPref.innerHTML;
            btnGuardarPref.innerHTML = '<i class="fas fa-check"></i> ¡Preferencias Guardadas!';
            btnGuardarPref.style.borderColor = '#10b981';
            btnGuardarPref.style.color = '#10b981';
            setTimeout(() => {
                btnGuardarPref.innerHTML = originalHTML;
                btnGuardarPref.style.borderColor = '';
                btnGuardarPref.style.color = '';
            }, 2500);
        });
    }

    // --- Lógica de Pestañas (Sidebar) ---
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.seccion-tab');

    if (menuItems.length > 0 && tabs.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = item.getAttribute('data-target');
                if (!targetId) return;
                e.preventDefault();

                menuItems.forEach(link => link.classList.remove('activo'));
                item.classList.add('activo');

                tabs.forEach(tab => tab.classList.remove('activa'));
                const targetTab = document.getElementById(targetId);
                if (targetTab) targetTab.classList.add('activa');
            });
        });
    }

    // Enlace "Ver todos" de Pedidos Recientes
    const enlaceVerTodos = document.querySelector('.enlace-ver-todos');
    if (enlaceVerTodos) {
        enlaceVerTodos.addEventListener('click', (e) => {
            e.preventDefault();
            const tabBtnPedidos = document.querySelector('.menu-item[data-target="pedidos"]');
            if (tabBtnPedidos) tabBtnPedidos.click();
        });
    }

    // Botones Cerrar Sesión
    document.querySelectorAll('.btn-cerrar-sesion').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                API.cerrarSesion();
            }
        });
    });

    // Carga inicial de datos
    await cargarInfoUsuario();
    await cargarPedidosUsuario();
});
