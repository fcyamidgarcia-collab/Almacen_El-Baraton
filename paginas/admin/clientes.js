// CLIENTES JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    let datosClientes = [
        { nombre: 'Constructora Andina S.A.', nit: '900.824.119-3', contacto: 'Ing. Carlos Morales', email: 'cmorales@andina.com.co', ciudad: 'Bogotá D.C.', credito: 25000000, pedidos: 14, estado: 'activo' },
        { nombre: 'Industrias Metalmecánicas', nit: '860.512.443-1', contacto: 'Dra. Elena Gómez', email: 'egomez@metalmecanicas.com', ciudad: 'Bucaramanga', credito: 15000000, pedidos: 8, estado: 'activo' },
        { nombre: 'Logística del Norte Ltda.', nit: '901.229.088-5', contacto: 'Rodrigo Pardo', email: 'rpardo@logisticanorte.com', ciudad: 'Barranquilla', credito: 30000000, pedidos: 22, estado: 'activo' }
    ];

    const cuerpoTablaClientes = document.getElementById('cuerpoTablaClientes');
    const modalCliente = document.getElementById('modalCliente');
    const btnNuevoCliente = document.getElementById('btnNuevoCliente');
    const btnCerrarModalCliente = document.getElementById('btnCerrarModalCliente');
    const btnCancelarCliente = document.getElementById('btnCancelarCliente');
    const formularioCliente = document.getElementById('formularioCliente');

    function formatearMoneda(val) { return '$ ' + Number(val).toLocaleString('es-CO'); }

    function renderizarTabla() {
        cuerpoTablaClientes.innerHTML = '';
        datosClientes.forEach(c => {
            const tr = document.createElement('tr');
            const insigniaEstado = c.estado === 'activo' ? '<span class="estado estado-enviado">● Activo</span>' : '<span class="estado estado-pendiente">● En Revisión</span>';
            tr.innerHTML = `
                <td><span class="nombre-cliente-tabla">${c.nombre}</span><span class="nit-cliente-tabla">NIT: ${c.nit}</span></td>
                <td><strong>${c.contacto}</strong><br><small style="color:#64748b;">${c.email}</small></td>
                <td>${c.ciudad}</td>
                <td><strong>${formatearMoneda(c.credito)}</strong></td>
                <td><span class="insignia" style="background:#f1f5f9; color:#334155;">${c.pedidos} pedidos</span></td>
                <td>${insigniaEstado}</td>
                <td style="text-align: center;">
                    <button class="boton-accion" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="boton-accion" title="Ver Historial"><i class="fas fa-eye"></i></button>
                </td>
            `;
            cuerpoTablaClientes.appendChild(tr);
        });
    }

    btnNuevoCliente.addEventListener('click', () => { formularioCliente.reset(); modalCliente.classList.add('activo'); });
    btnCerrarModalCliente.addEventListener('click', () => modalCliente.classList.remove('activo'));
    btnCancelarCliente.addEventListener('click', () => modalCliente.classList.remove('activo'));

    formularioCliente.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('cliNombre').value.trim(),
            nit: document.getElementById('cliNit').value.trim(),
            contacto: document.getElementById('cliContacto').value.trim(),
            email: document.getElementById('cliEmail').value.trim(),
            ciudad: document.getElementById('cliCiudad').value.trim(),
            credito: parseFloat(document.getElementById('cliCredito').value) || 10000000,
            pedidos: 0,
            estado: 'activo'
        };
        datosClientes.unshift(nuevo);
        modalCliente.classList.remove('activo');
        renderizarTabla();
    });

    renderizarTabla();
});
