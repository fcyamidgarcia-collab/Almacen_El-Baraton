// CATEGORÍAS JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    let datosCategorias = [
        { nombre: 'Herramientas Eléctricas', desc: 'Taladros, esmeriles, sierras industriales', icono: 'fa-bolt', conteo: 42 },
        { nombre: 'Ferretería Pesada', desc: 'Eslingas, cadenas, discos de corte y tornillería', icono: 'fa-tools', conteo: 38 },
        { nombre: 'EPP & Seguridad', desc: 'Cascos, gafas, guantes dieléctricos y arneses', icono: 'fa-hard-hat', conteo: 29 },
        { nombre: 'Maquinaria & Equipos', desc: 'Generadores, compresores y motobombas', icono: 'fa-cogs', conteo: 18 },
        { nombre: 'Eléctricos e Iluminación', desc: 'Tableros, cables industriales y reflectores LED', icono: 'fa-plug', conteo: 18 }
    ];

    const rejilla = document.getElementById('rejillaCategorias');
    const modal = document.getElementById('modalCategoria');
    const btnNuevo = document.getElementById('btnNuevaCategoria');
    const btnCerrar = document.getElementById('btnCerrarModalCategoria');
    const btnCancelar = document.getElementById('btnCancelarCategoria');
    const formulario = document.getElementById('formularioCategoria');

    function renderizar() {
        rejilla.innerHTML = '';
        datosCategorias.forEach(c => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-categoria';
            tarjeta.innerHTML = `
                <div class="contenedor-icono-categoria"><i class="fas ${c.icono}"></i></div>
                <div>
                    <h3 class="titulo-categoria">${c.nombre}</h3>
                    <p style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">${c.desc}</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
                    <span class="conteo-categoria"><i class="fas fa-box"></i> ${c.conteo} productos</span>
                    <button class="boton boton-secundario" style="padding: 4px 10px; font-size: 0.78rem;">Editar</button>
                </div>
            `;
            rejilla.appendChild(tarjeta);
        });
    }

    btnNuevo.addEventListener('click', () => { formulario.reset(); modal.classList.add('activo'); });
    btnCerrar.addEventListener('click', () => modal.classList.remove('activo'));
    btnCancelar.addEventListener('click', () => modal.classList.remove('activo'));

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const nueva = {
            nombre: document.getElementById('catNombre').value.trim(),
            desc: document.getElementById('catDesc').value.trim() || 'Sin descripción',
            icono: document.getElementById('catIcono').value.trim() || 'fa-folder',
            conteo: 0
        };
        datosCategorias.push(nueva);
        modal.classList.remove('activo');
        renderizar();
    });

    renderizar();
});
