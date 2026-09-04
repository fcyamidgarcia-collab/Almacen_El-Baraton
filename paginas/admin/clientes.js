// ========== CLIENTES ADMIN - CONECTADO A MYSQL (COMPLETO EDITAR / ELIMINAR) ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const tbody = document.getElementById('cuerpoTablaClientes');
    const modal = document.getElementById('modalCliente');
    const modalTitulo = document.getElementById('modalClienteTitulo');
    const btnNuevo = document.getElementById('btnNuevoCliente');
    const btnCerrar = document.getElementById('btnCerrarModalCliente');
    const btnCancelar = document.getElementById('btnCancelarCliente');
    const form = document.getElementById('formularioCliente');

    const kpiTotales = document.getElementById('kpiClientesTotales');
    const kpiActivos = document.getElementById('kpiClientesActivos');
    const kpiInactivos = document.getElementById('kpiClientesInactivos');

    async function cargar() {
        try {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando clientes desde MySQL...</td></tr>`;
            const [clientes, pedidos, prods] = await Promise.all([
                API.getClientes(),
                API.getPedidos().catch(() => []),
                API.getProductos({ estado: 'activo' }).catch(() => [])
            ]);

            datos = clientes || [];

            // Actualizar KPIs
            const total = datos.length;
            const activos = datos.filter(c => (c.estado || 'activo') === 'activo').length;
            const inactivos = total - activos;

            if (kpiTotales) kpiTotales.textContent = total;
            if (kpiActivos) kpiActivos.textContent = activos;
            if (kpiInactivos) kpiInactivos.textContent = inactivos;

            // Insignias del Sidebar
            const bCli = document.getElementById('insigniaClientesBarra');
            const bPed = document.getElementById('insigniaPedidosBarra');
            const bProd = document.getElementById('insigniaProductosBarra');
            if (bCli) bCli.textContent = total;
            if (bPed) bPed.textContent = pedidos.length;
            if (bProd) bProd.textContent = prods.length;

            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error al conectar con MySQL: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:25px;color:#64748b">No hay clientes registrados en la base de datos.</td></tr>`;
            return;
        }

        datos.forEach(c => {
            const tr = document.createElement('tr');
            const esActivo = (c.estado || 'activo') === 'activo';
            const badgeEstado = esActivo
                ? '<span class="estado estado-enviado">Activo</span>'
                : '<span class="estado estado-cancelado">Inactivo</span>';

            tr.innerHTML = `
                <td>
                    <strong class="nombre-cliente-tabla">${c.nombre} ${c.apellido || ''}</strong>
                </td>
                <td><code>${c.documento_identidad || 'Sin documento'}</code></td>
                <td>
                    <strong>${c.telefono || 'Sin teléfono'}</strong><br>
                    <small style="color:#64748b">${c.correo || 'Sin correo registrado'}</small>
                </td>
                <td>${c.ciudad || 'Bogotá D.C.'}</td>
                <td><small style="color:#475569">${c.direccion || 'Sin dirección'}</small></td>
                <td><span class="insignia" style="background:#f1f5f9;color:#334155">${c.total_pedidos || 0} pedidos</span></td>
                <td>${badgeEstado}</td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-cli" data-id="${c.id_cliente}" title="Editar Cliente"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion btn-eliminar-cli" data-id="${c.id_cliente}" title="Eliminar Cliente" style="color:#ef4444"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Botones de editar
        document.querySelectorAll('.btn-editar-cli').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const cli = datos.find(c => c.id_cliente === id);
                if (!cli) return;

                modoEdicion = id;
                if (modalTitulo) modalTitulo.textContent = `Editar Cliente #${id}`;

                let rawDoc = cli.documento_identidad || '';
                let tipoDoc = cli.tipo_documento || 'NIT';
                let numDoc = rawDoc;
                if (rawDoc.includes(':')) {
                    const p = rawDoc.split(':');
                    tipoDoc = p[0].trim().toUpperCase();
                    numDoc = p.slice(1).join(':').trim();
                }

                document.getElementById('cliNombre').value = cli.nombre || '';
                document.getElementById('cliApellido').value = cli.apellido || '';
                const selTipo = document.getElementById('cliTipoDoc');
                if (selTipo) selTipo.value = tipoDoc;
                document.getElementById('cliNit').value = numDoc;
                const elCorreo = document.getElementById('cliCorreo');
                if (elCorreo) elCorreo.value = cli.correo || '';
                document.getElementById('cliContacto').value = cli.telefono || '';
                document.getElementById('cliDireccion').value = cli.direccion || '';
                document.getElementById('cliCiudad').value = cli.ciudad || '';

                limpiarTodosLosErrores();
                modal.classList.add('activo');
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-eliminar-cli').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const cli = datos.find(c => String(c.id_cliente) === String(id));
                const nombre = cli ? `${cli.nombre} ${cli.apellido || ''}`.trim() : `#${id}`;

                if (!confirm(`¿Estás seguro de eliminar al cliente "${nombre}" de la base de datos MySQL? Esta acción no se puede deshacer.`)) return;

                try {
                    await API.eliminarCliente(id);
                    alert(`¡Cliente "${nombre}" eliminado exitosamente!`);
                    await cargar();
                } catch (err) {
                    alert('Error al eliminar cliente: ' + err.message);
                }
            });
        });
    }

    function cerrarModal() {
        modal.classList.remove('activo');
        form.reset();
        limpiarTodosLosErrores();
        modoEdicion = null;
    }

    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            modoEdicion = null;
            if (modalTitulo) modalTitulo.textContent = 'Registrar Nuevo Cliente';
            form.reset();
            limpiarTodosLosErrores();
            modal.classList.add('activo');
        });
    }

    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);

    // Helper de error en modal cliente
    function mostrarErrorCli(input, msg) {
        limpiarErrorCli(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-cli-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorCli(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-cli-msg')) sig.remove();
    }

    function limpiarTodosLosErrores() {
        ['cliNombre', 'cliApellido', 'cliNit', 'cliCorreo', 'cliContacto', 'cliDireccion', 'cliCiudad'].forEach(id => {
            const el = document.getElementById(id);
            if (el) limpiarErrorCli(el);
        });
    }

    ['cliNombre', 'cliApellido', 'cliNit', 'cliCorreo', 'cliContacto', 'cliDireccion', 'cliCiudad'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => limpiarErrorCli(el));
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const elNombre = document.getElementById('cliNombre');
            const elApellido = document.getElementById('cliApellido');
            const elTipoDoc = document.getElementById('cliTipoDoc');
            const elNit = document.getElementById('cliNit');
            const elCorreo = document.getElementById('cliCorreo');
            const elContacto = document.getElementById('cliContacto');
            const elDireccion = document.getElementById('cliDireccion');
            const elCiudad = document.getElementById('cliCiudad');

            const nombre = elNombre.value.trim();
            const apellido = elApellido ? elApellido.value.trim() : '';
            const tipoDoc = elTipoDoc ? elTipoDoc.value : 'NIT';
            const documento_identidad = elNit.value.trim();
            const correo = elCorreo ? elCorreo.value.trim() : '';
            const telefono = elContacto.value.trim();
            const direccion = elDireccion.value.trim();
            const ciudad = elCiudad.value.trim();

            const telefonoRegex = /^[+]?[\d\s().-]{7,20}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let esValido = true;

            if (!nombre || nombre.length < 2) {
                mostrarErrorCli(elNombre, 'El nombre debe tener al menos 2 caracteres.');
                esValido = false;
            } else {
                limpiarErrorCli(elNombre);
            }

            // Apellido es opcional; si se proporciona debe tener al menos 2 caracteres
            if (apellido && apellido.length < 2) {
                mostrarErrorCli(elApellido, 'Si ingresas apellido o razón complementaria, debe tener al menos 2 caracteres.');
                esValido = false;
            } else if (elApellido) {
                limpiarErrorCli(elApellido);
            }

            if (!documento_identidad || documento_identidad.length < 4) {
                mostrarErrorCli(elNit, 'El documento o NIT debe tener al menos 4 caracteres.');
                esValido = false;
            } else {
                limpiarErrorCli(elNit);
            }

            if (correo && !emailRegex.test(correo)) {
                mostrarErrorCli(elCorreo, 'Ingresa un formato de correo electrónico válido.');
                esValido = false;
            } else if (elCorreo) {
                limpiarErrorCli(elCorreo);
            }

            if (telefono && !telefonoRegex.test(telefono)) {
                mostrarErrorCli(elContacto, 'Teléfono inválido (mínimo 7 dígitos).');
                esValido = false;
            } else {
                limpiarErrorCli(elContacto);
            }

            if (!direccion || direccion.length < 5) {
                mostrarErrorCli(elDireccion, 'La dirección debe tener al menos 5 caracteres.');
                esValido = false;
            } else {
                limpiarErrorCli(elDireccion);
            }

            if (!ciudad || ciudad.length < 2) {
                mostrarErrorCli(elCiudad, 'Ingresa una ciudad válida.');
                esValido = false;
            } else {
                limpiarErrorCli(elCiudad);
            }

            if (!esValido) return;

            const btnSubmit = document.getElementById('btnGuardarCliente');
            const originalHTML = btnSubmit.innerHTML;

            const payload = {
                nombre,
                apellido,
                tipo_documento: tipoDoc,
                documento_identidad: `${tipoDoc}: ${documento_identidad}`,
                numero_documento: documento_identidad,
                correo: correo || null,
                telefono,
                direccion,
                ciudad,
                estado: 'activo'
            };

            try {
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                if (modoEdicion) {
                    await API.actualizarCliente(modoEdicion, payload);
                    alert('¡Cliente actualizado exitosamente en MySQL!');
                } else {
                    await API.crearCliente(payload);
                    alert('¡Cliente registrado exitosamente en MySQL!');
                }

                cerrarModal();
                await cargar();
            } catch (err) {
                alert('Error al procesar cliente: ' + err.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalHTML;
            }
        });
    }

    await cargar();
});
