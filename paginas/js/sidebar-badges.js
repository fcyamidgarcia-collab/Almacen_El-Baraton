// ========== SIDEBAR BADGES - CARGA DINÁMICA DESDE BD ==========
// Se incluye en todas las páginas admin para mantener las insignias sincronizadas
(async function cargarInsigniasSidebar() {
    try {
        const [stats, pedidos] = await Promise.all([
            API.getDashboardStats().catch(() => null),
            API.getPedidos().catch(() => [])
        ]);

        const totalPedidos = Array.isArray(pedidos) ? pedidos.length : 0;
        const totalProductos = stats?.total_productos || 0;
        const totalClientes = stats?.total_clientes || 0;

        const bPedidos = document.getElementById('insigniaPedidosBarra');
        const bProductos = document.getElementById('insigniaProductosBarra');
        const bClientes = document.getElementById('insigniaClientesBarra');

        if (bPedidos) bPedidos.textContent = totalPedidos;
        if (bProductos) bProductos.textContent = totalProductos;
        if (bClientes) bClientes.textContent = totalClientes;
    } catch (e) {
        console.warn('Error cargando insignias sidebar:', e.message);
    }
})();
