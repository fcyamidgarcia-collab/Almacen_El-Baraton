// PROVEEDORES JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    let datosProveedores = [
        { nombre: 'Bosch Industrial S.A.', contacto: 'Martín Serna', categoria: 'Herramientas Eléctricas', telefono: '+57 (601) 488-2900', calificacion: 4.9 },
        { nombre: 'Lincoln Electric Colombia', contacto: 'Diana Suárez', categoria: 'Maquinaria & Equipos', telefono: '+57 (604) 312-7000', calificacion: 4.8 },
        { nombre: '3M Colombia S.A.', contacto: 'Jorge Mendoza', categoria: 'EPP & Seguridad', telefono: '+57 (601) 607-0707', calificacion: 5.0 }
    ];

    const cuerpoTablaProveedores = document.getElementById('cuerpoTablaProveedores');
    const modalProveedor = document.getElementById('modalProveedor');
    const btnNuevoProveedor = document.getElementById('btnNuevoProveedor');
    const btnCerrarModalProveedor = document.getElementById('btnCerrarModalProveedor');
    const btnCancelarProveedor = document.getElementById('btnCancelarProveedor');
    const formularioProveedor = document.getElementById('formularioProveedor');

    function renderizarTabla() {
        cuerpoTablaProveedores.innerHTML = '';
        datosProveedores.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="nombre-proveedor">${p.nombre}</span></td>
                <td><strong>${p.contacto}</strong></td>
                <td>${p.categoria}</td>
                <td>${p.telefono}</td>
                <td><span class="calificacion-estrella"><i class="fas fa-star"></i> ${p.calificacion}</span></td>
                <td style="text-align: center;">
                    <button class="boton-accion" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion" title="Contactar"><i class="fas fa-envelope"></i></button>
                </td>
            `;
            cuerpoTablaProveedores.appendChild(tr);
        });
    }

    btnNuevoProveedor.addEventListener('click', () => { formularioProveedor.reset(); modalProveedor.classList.add('activo'); });
    btnCerrarModalProveedor.addEventListener('click', () => modalProveedor.classList.remove('activo'));
    btnCancelarProveedor.addEventListener('click', () => modalProveedor.classList.remove('activo'));

    formularioProveedor.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('provNombre').value.trim(),
            contacto: document.getElementById('provContacto').value.trim(),
            categoria: document.getElementById('provCat').value.trim(),
            telefono: document.getElementById('provTelefono').value.trim(),
            calificacion: 5.0
        };
        datosProveedores.unshift(nuevo);
        modalProveedor.classList.remove('activo');
        renderizarTabla();
    });

    renderizarTabla();
});
