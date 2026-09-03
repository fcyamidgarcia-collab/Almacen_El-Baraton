// ========== CATEGORÍAS ADMIN - CONECTADO A MYSQL ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const rejilla = document.getElementById('rejillaCategorias');
    const modal = document.getElementById('modalCategoria');
    const btnNuevo = document.getElementById('btnNuevaCategoria');
    const btnCerrar = document.getElementById('btnCerrarModalCategoria');
    const btnCancelar = document.getElementById('btnCancelarCategoria');
    const form = document.getElementById('formularioCategoria');

    const iconosDisponibles = {
        'herramientas': 'fa-tools', 'ferreteria': 'fa-hammer', 'pintura': 'fa-paint-brush',
        'electricidad': 'fa-bolt', 'plomeria': 'fa-faucet', 'seguridad': 'fa-shield-alt',
        'general': 'fa-box', 'default': 'fa-folder'
    };

    function obtenerIcono(nombre) {
        const n = (nombre || '').toLowerCase();
        for (const [key, ico] of Object.entries(iconosDisponibles)) {
            if (n.includes(key)) return ico;
        }
        return iconosDisponibles.default;
    }

    async function cargar() {
        try {
            rejilla.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;
            datos = await API.getCategorias();
            renderizar();
        } catch (err) {
            rejilla.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
        }
    }

    function renderizar() {
        rejilla.innerHTML = '';
        if (datos.length === 0) {
            rejilla.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#64748b">No hay categorías registradas.</div>`;
            return;
        }
        datos.forEach(c => {
            const icono = obtenerIcono(c.nombre_categoria);
            const div = document.createElement('div');
            div.className = 'tarjeta-categoria';
            div.innerHTML = `
                <div class="contenedor-icono-categoria"><i class="fas ${icono}"></i></div>
                <div>
                    <h3 class="titulo-categoria">${c.nombre_categoria}</h3>
                    <p style="font-size:0.82rem;color:#64748b;margin-top:4px">${c.descripcion || 'Sin descripción'}</p>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9">
                    <span class="conteo-categoria"><i class="fas fa-box"></i> ${c.total_productos || 0} productos</span>
                    <div style="display:flex;gap:6px">
                        <button class="boton-accion btn-editar-cat" data-id="${c.id_categoria}" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="boton-accion btn-eliminar-cat" data-id="${c.id_categoria}" title="Eliminar" style="color:#ef4444"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            rejilla.appendChild(div);
        });

        document.querySelectorAll('.btn-editar-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const cat = datos.find(c => c.id_categoria === id);
                if (!cat) return;
                modoEdicion = id;
                document.getElementById('catNombre').value = cat.nombre_categoria || '';
                document.getElementById('catDesc').value = cat.descripcion || '';
                modal.classList.add('activo');
            });
        });

        document.querySelectorAll('.btn-eliminar-cat').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;
                try {
                    await API.eliminarCategoria(id);
                    await cargar();
                } catch (err) { alert('Error: ' + err.message); }
            });
        });
    }

    btnNuevo?.addEventListener('click', () => { modoEdicion = null; form.reset(); modal.classList.add('activo'); });
    btnCerrar?.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    // Helper de error en modal categoría
    function mostrarErrorCat(input, msg) {
        limpiarErrorCat(input);
        input.style.borderColor = '#ef4444';
        const span = document.createElement('span');
        span.className = 'error-cat-msg';
        span.style.cssText = 'color:#ef4444;font-size:0.75rem;margin-top:3px;display:block;font-weight:500;';
        span.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        input.insertAdjacentElement('afterend', span);
    }

    function limpiarErrorCat(input) {
        input.style.borderColor = '';
        const sig = input.nextElementSibling;
        if (sig && sig.classList.contains('error-cat-msg')) sig.remove();
    }

    const inputCatNombre = document.getElementById('catNombre');
    if (inputCatNombre) inputCatNombre.addEventListener('input', () => limpiarErrorCat(inputCatNombre));

    form?.addEventListener('submit', async e => {
        e.preventDefault();

        const nombre_categoria = inputCatNombre ? inputCatNombre.value.trim() : '';
        const descripcion = document.getElementById('catDesc')?.value.trim() || 'Sin descripción';

        if (!nombre_categoria || nombre_categoria.length < 2) {
            mostrarErrorCat(inputCatNombre, 'El nombre de la categoría debe tener al menos 2 caracteres.');
            return;
        } else {
            limpiarErrorCat(inputCatNombre);
        }

        const payload = {
            nombre_categoria,
            descripcion
        };
        try {
            if (modoEdicion) {
                await API.actualizarCategoria(modoEdicion, payload);
                alert('¡Categoría actualizada!');
            } else {
                await API.crearCategoria(payload);
                alert('¡Categoría creada en MySQL!');
            }
            modal.classList.remove('activo');
            form.reset();
            modoEdicion = null;
            await cargar();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargar();
});
