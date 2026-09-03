// ========== PROVEEDORES ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const tbody = document.getElementById('cuerpoTablaProveedores');
    const modal = document.getElementById('modalProveedor');
    const btnNuevo = document.getElementById('btnNuevoProveedor');
    const btnCerrar = document.getElementById('btnCerrarModalProveedor');
    const btnCancelar = document.getElementById('btnCancelarProveedor');
    const form = document.getElementById('formularioProveedor');

    async function cargar() {
        try {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>`;
            datos = await API.getProveedores();
            renderizar();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</td></tr>`;
        }
    }

    function renderizar() {
        tbody.innerHTML = '';
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:25px;color:#64748b">No hay proveedores registrados.</td></tr>`;
            return;
        }
        datos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="nombre-proveedor">${p.nombre_proveedor}</span></td>
                <td><strong>${p.contacto || 'Contacto directo'}</strong></td>
                <td>${p.correo || 'Sin correo'}</td>
                <td>${p.telefono || 'Sin teléfono'}</td>
                <td>${p.direccion || 'Sin dirección'}</td>
                <td style="text-align:center;display:flex;gap:6px;justify-content:center">
                    <button class="boton-accion btn-editar-prov" data-id="${p.id_proveedor}" title="Editar"><i class="fas fa-edit"></i></button>
                    <a href="mailto:${p.correo || ''}" class="boton-accion" title="Enviar correo"><i class="fas fa-envelope"></i></a>
                    <button class="boton-accion btn-eliminar-prov" data-id="${p.id_proveedor}" title="Eliminar" style="color:#ef4444"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-editar-prov').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const prov = datos.find(p => p.id_proveedor === id);
                if (!prov) return;
                modoEdicion = id;
                document.getElementById('provNombre').value = prov.nombre_proveedor || '';
                document.getElementById('provContacto').value = prov.contacto || '';
                document.getElementById('provTelefono').value = prov.telefono || '';
                const emailEl = document.getElementById('provEmail') || document.getElementById('provCat');
                if (emailEl) emailEl.value = prov.correo || '';
                const dirEl = document.getElementById('provDireccion');
                if (dirEl) dirEl.value = prov.direccion || '';
                modal.classList.add('activo');
            });
        });

        document.querySelectorAll('.btn-eliminar-prov').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('¿Eliminar este proveedor?')) return;
                try {
                    await API.eliminarProveedor(id);
                    await cargar();
                } catch (err) { alert('Error: ' + err.message); }
            });
        });
    }

    // Helper de error en modal proveedor
    function mostrarErrorProv(input, msg) {
        limpiarErrorProv(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-prov-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorProv(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-prov-msg')) sig.remove();
    }

    ['provNombre', 'provContacto', 'provTelefono', 'provEmail', 'provCat', 'provDireccion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => limpiarErrorProv(el));
    });

    btnNuevo?.addEventListener('click', () => { modoEdicion = null; form.reset(); modal.classList.add('activo'); });
    btnCerrar?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    form?.addEventListener('submit', async e => {
        e.preventDefault();

        const elNombre = document.getElementById('provNombre');
        const elContacto = document.getElementById('provContacto');
        const elTelefono = document.getElementById('provTelefono');
        const emailEl = document.getElementById('provEmail') || document.getElementById('provCat');
        const dirEl = document.getElementById('provDireccion');

        const nombre_proveedor = elNombre.value.trim();
        const contacto = elContacto.value.trim();
        const telefono = elTelefono.value.trim();
        const correo = emailEl?.value.trim() || '';
        const direccion = dirEl?.value.trim() || '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telefonoRegex = /^[+]?[\d\s-]{7,15}$/;
        let esValido = true;

        if (!nombre_proveedor || nombre_proveedor.length < 3) {
            mostrarErrorProv(elNombre, 'El nombre del proveedor/empresa debe tener al menos 3 caracteres.');
            esValido = false;
        } else {
            limpiarErrorProv(elNombre);
        }

        if (!contacto || contacto.length < 2) {
            mostrarErrorProv(elContacto, 'El nombre de contacto debe tener al menos 2 caracteres.');
            esValido = false;
        } else {
            limpiarErrorProv(elContacto);
        }

        if (telefono && !telefonoRegex.test(telefono)) {
            mostrarErrorProv(elTelefono, 'Teléfono inválido (mínimo 7 dígitos).');
            esValido = false;
        } else {
            limpiarErrorProv(elTelefono);
        }

        if (correo && !emailRegex.test(correo)) {
            mostrarErrorProv(emailEl, 'Formato de correo electrónico inválido.');
            esValido = false;
        } else if (emailEl) {
            limpiarErrorProv(emailEl);
        }

        if (!esValido) return;

        const payload = {
            nombre_proveedor,
            contacto,
            telefono,
            correo,
            direccion
        };
        try {
            if (modoEdicion) {
                await API.actualizarProveedor(modoEdicion, payload);
                alert('¡Proveedor actualizado!');
            } else {
                await API.crearProveedor(payload);
                alert('¡Proveedor registrado en MySQL!');
            }
            modal.classList.remove('activo');
            form.reset();
            modoEdicion = null;
            await cargar();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargar();
});
