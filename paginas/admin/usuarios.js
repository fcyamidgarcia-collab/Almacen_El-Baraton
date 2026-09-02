// USUARIOS JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    let datosUsuarios = [
        { nombre: 'Admin Principal', email: 'admin@industrialsupply.com', rol: 'Administrador', ultimoAcceso: 'Hace 5 minutos', estado: 'Activo' },
        { nombre: 'Sandra Milena Pérez', email: 'sperez@industrialsupply.com', rol: 'Vendedor', ultimoAcceso: 'Hoy 10:45 a.m.', estado: 'Activo' },
        { nombre: 'Jorge Iván Ospina', email: 'jospina@industrialsupply.com', rol: 'Supervisor', ultimoAcceso: 'Ayer 17:30', estado: 'Activo' }
    ];

    const cuerpoTablaUsuarios = document.getElementById('cuerpoTablaUsuarios');
    const modalUsuario = document.getElementById('modalUsuario');
    const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
    const btnCerrarModalUsuario = document.getElementById('btnCerrarModalUsuario');
    const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
    const formularioUsuario = document.getElementById('formularioUsuario');

    function renderizarTabla() {
        cuerpoTablaUsuarios.innerHTML = '';
        datosUsuarios.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="nombre-usuario-tabla">${u.nombre}</span></td>
                <td>${u.email}</td>
                <td><span class="insignia-rol">${u.rol}</span></td>
                <td>${u.ultimoAcceso}</td>
                <td><span class="texto-verde">● ${u.estado}</span></td>
                <td style="text-align: center;">
                    <button class="boton-accion" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion" title="Bloquear"><i class="fas fa-user-lock"></i></button>
                </td>
            `;
            cuerpoTablaUsuarios.appendChild(tr);
        });
    }

    btnNuevoUsuario.addEventListener('click', () => { formularioUsuario.reset(); modalUsuario.classList.add('activo'); });
    btnCerrarModalUsuario.addEventListener('click', () => modalUsuario.classList.remove('activo'));
    btnCancelarUsuario.addEventListener('click', () => modalUsuario.classList.remove('activo'));

    formularioUsuario.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('usrNombre').value.trim(),
            email: document.getElementById('usrEmail').value.trim(),
            rol: document.getElementById('usrRol').value,
            ultimoAcceso: 'Justo ahora',
            estado: 'Activo'
        };
        datosUsuarios.push(nuevo);
        modalUsuario.classList.remove('activo');
        renderizarTabla();
    });

    renderizarTabla();
});
