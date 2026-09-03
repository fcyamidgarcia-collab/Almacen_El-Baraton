// ========== CATEGORÍAS ADMIN - CON SOPORTE DE IMAGEN ==========

document.addEventListener('DOMContentLoaded', async () => {
    let datos = [];
    let modoEdicion = null;

    const rejilla = document.getElementById('rejillaCategorias');
    const modal   = document.getElementById('modalCategoria');
    const btnNuevo   = document.getElementById('btnNuevaCategoria');
    const btnCerrar  = document.getElementById('btnCerrarModalCategoria');
    const btnCancelar = document.getElementById('btnCancelarCategoria');
    const form = document.getElementById('formularioCategoria');

    const inputCatNombre = document.getElementById('catNombre');
    const inputCatDesc   = document.getElementById('catDesc');
    const inputCatImagen = document.getElementById('catImagen');
    const previewDiv     = document.getElementById('previewCatImagen');
    const imgPreview     = document.getElementById('imgPreviewCat');
    const tituloModal    = document.getElementById('tituloModalCategoria');

    // ---- Vista previa de imagen en tiempo real ----
    inputCatImagen?.addEventListener('input', () => {
        const url = inputCatImagen.value.trim();
        if (url) {
            imgPreview.src = url;
            previewDiv.style.display = 'flex';
        } else {
            previewDiv.style.display = 'none';
        }
    });

    // ---- Obtener ícono fallback por nombre ----
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

    // ---- Cargar desde API ----
    async function cargar() {
        try {
            rejilla.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#64748b"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;
            datos = await API.getCategorias();
            renderizar();
        } catch (err) {
            rejilla.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
        }
    }

    // ---- Renderizar tarjetas ----
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

            // Mostrar imagen si existe, si no mostrar ícono
            const imgHTML = c.imagen
                ? `<div style="width:100%;height:90px;overflow:hidden;border-radius:8px;margin-bottom:10px;">
                       <img src="${c.imagen}" alt="${c.nombre_categoria}" loading="lazy"
                            style="width:100%;height:100%;object-fit:cover;"
                            onerror="this.parentElement.innerHTML='<div style=\'height:90px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border-radius:8px\'><i class=\'fas ${icono}\' style=\'font-size:2rem;color:#94a3b8\'></i></div>'">
                   </div>`
                : `<div class="contenedor-icono-categoria"><i class="fas ${icono}"></i></div>`;

            div.innerHTML = `
                ${imgHTML}
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

        // ---- Eventos editar ----
        document.querySelectorAll('.btn-editar-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const cat = datos.find(c => c.id_categoria === id);
                if (!cat) return;
                modoEdicion = id;
                if (tituloModal) tituloModal.textContent = 'Editar Categoría';
                inputCatNombre.value = cat.nombre_categoria || '';
                inputCatDesc.value   = cat.descripcion || '';
                inputCatImagen.value = cat.imagen || '';
                // Actualizar vista previa
                if (cat.imagen) {
                    imgPreview.src = cat.imagen;
                    previewDiv.style.display = 'flex';
                } else {
                    previewDiv.style.display = 'none';
                }
                modal.classList.add('activo');
            });
        });

        // ---- Eventos eliminar ----
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

    // ---- Abrir modal nueva ----
    btnNuevo?.addEventListener('click', () => {
        modoEdicion = null;
        form.reset();
        if (tituloModal) tituloModal.textContent = 'Crear Nueva Categoría';
        previewDiv.style.display = 'none';
        modal.classList.add('activo');
    });

    btnCerrar?.addEventListener('click', ()  => modal.classList.remove('activo'));
    btnCancelar?.addEventListener('click', () => modal.classList.remove('activo'));

    // ---- Validación visual ----
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

    inputCatNombre?.addEventListener('input', () => limpiarErrorCat(inputCatNombre));

    // ---- Envío del formulario ----
    form?.addEventListener('submit', async e => {
        e.preventDefault();

        const nombre_categoria = inputCatNombre?.value.trim() || '';
        const descripcion      = inputCatDesc?.value.trim()   || '';
        const imagen           = inputCatImagen?.value.trim() || null;

        if (!nombre_categoria || nombre_categoria.length < 2) {
            mostrarErrorCat(inputCatNombre, 'El nombre debe tener al menos 2 caracteres.');
            return;
        }
        limpiarErrorCat(inputCatNombre);

        const payload = { nombre_categoria, descripcion, imagen };

        try {
            if (modoEdicion) {
                await API.actualizarCategoria(modoEdicion, payload);
                alert('¡Categoría actualizada!');
            } else {
                await API.crearCategoria(payload);
                alert('¡Categoría creada!');
            }
            modal.classList.remove('activo');
            form.reset();
            previewDiv.style.display = 'none';
            modoEdicion = null;
            await cargar();
        } catch (err) { alert('Error: ' + err.message); }
    });

    await cargar();
});
