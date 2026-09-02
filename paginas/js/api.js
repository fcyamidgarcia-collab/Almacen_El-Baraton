// API - ALMACEN EL BARATON
// Conecta el Frontend con el Servidor Node.js y MySQL

const API_BASE_URL = window.location.origin.includes(':3000')
    ? '/api'
    : 'http://localhost:3000/api';

const API = {
    // ---- Helper general ----
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('baraton_token');
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            }
        };
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error en la solicitud');
            return data;
        } catch (error) {
            console.warn(`[API] Error en ${endpoint}:`, error.message);
            throw error;
        }
    },

    // ---- 1. AUTENTICACIÓN ----
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            localStorage.setItem('baraton_token', data.token);
            localStorage.setItem('baraton_user', JSON.stringify(data.usuario));
        }
        return data;
    },

    async registro(datosUsuario) {
        const data = await this.request('/auth/registro', {
            method: 'POST',
            body: JSON.stringify(datosUsuario)
        });
        if (data.token) {
            localStorage.setItem('baraton_token', data.token);
            localStorage.setItem('baraton_user', JSON.stringify(data.usuario));
        }
        return data;
    },

    getUsuarioActual() {
        try { return JSON.parse(localStorage.getItem('baraton_user')) || null; }
        catch { return null; }
    },

    async actualizarPerfil(id_usuario, datos) {
        return await this.request(`/auth/perfil/${id_usuario}`, {
            method: 'PUT',
            body: JSON.stringify(datos)
        });
    },

    async cambiarContrasena(id_usuario, actualPassword, nuevaPassword) {
        return await this.request('/auth/cambiar-contrasena', {
            method: 'PUT',
            body: JSON.stringify({ id_usuario, actualPassword, nuevaPassword })
        });
    },

    cerrarSesion() {
        localStorage.removeItem('baraton_token');
        localStorage.removeItem('baraton_user');
        window.location.href = '../sesion/index.html';
    },

    // ---- 2. PRODUCTOS ----
    async getProductos(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await this.request(`/productos${qs ? `?${qs}` : ''}`);
    },
    async getProducto(id) { return await this.request(`/productos/${id}`); },
    async crearProducto(producto) {
        return await this.request('/productos', { method: 'POST', body: JSON.stringify(producto) });
    },
    async actualizarProducto(id, producto) {
        return await this.request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(producto) });
    },
    async eliminarProducto(id) {
        return await this.request(`/productos/${id}`, { method: 'DELETE' });
    },

    // ---- 3. CATEGORÍAS ----
    async getCategorias() { return await this.request('/categorias'); },
    async crearCategoria(cat) {
        return await this.request('/categorias', { method: 'POST', body: JSON.stringify(cat) });
    },
    async actualizarCategoria(id, cat) {
        return await this.request(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(cat) });
    },
    async eliminarCategoria(id) {
        return await this.request(`/categorias/${id}`, { method: 'DELETE' });
    },

    // ---- 4. CLIENTES ----
    async getClientes() { return await this.request('/clientes'); },
    async getClientePorUsuario(id_usuario) { return await this.request(`/clientes/usuario/${id_usuario}`); },
    async getPedidosCliente(id_cliente) { return await this.request(`/clientes/${id_cliente}/pedidos`); },
    async crearCliente(cliente) {
        return await this.request('/clientes', { method: 'POST', body: JSON.stringify(cliente) });
    },
    async actualizarCliente(id, cliente) {
        return await this.request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(cliente) });
    },
    async eliminarCliente(id) {
        return await this.request(`/clientes/${id}`, { method: 'DELETE' });
    },

    // ---- 5. PROVEEDORES ----
    async getProveedores() { return await this.request('/proveedores'); },
    async crearProveedor(prov) {
        return await this.request('/proveedores', { method: 'POST', body: JSON.stringify(prov) });
    },
    async actualizarProveedor(id, prov) {
        return await this.request(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(prov) });
    },
    async eliminarProveedor(id) {
        return await this.request(`/proveedores/${id}`, { method: 'DELETE' });
    },

    // ---- 6. PEDIDOS ----
    async getPedidos(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await this.request(`/pedidos${qs ? `?${qs}` : ''}`);
    },
    async getPedido(id) { return await this.request(`/pedidos/${id}`); },
    async crearPedido(datos) {
        return await this.request('/pedidos', { method: 'POST', body: JSON.stringify(datos) });
    },
    async actualizarEstadoPedido(id, estado_pedido, observaciones) {
        return await this.request(`/pedidos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ estado_pedido, observaciones })
        });
    },

    // ---- 7. USUARIOS ----
    async getUsuarios() { return await this.request('/usuarios'); },
    async crearUsuario(usuario) {
        return await this.request('/usuarios', { method: 'POST', body: JSON.stringify(usuario) });
    },
    async actualizarUsuario(id, usuario) {
        return await this.request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(usuario) });
    },
    async toggleEstadoUsuario(id) {
        return await this.request(`/usuarios/${id}/toggle`, { method: 'PUT' });
    },
    async eliminarUsuario(id) {
        return await this.request(`/usuarios/${id}`, { method: 'DELETE' });
    },

    // ---- 8. DASHBOARD / REPORTES ----
    async getDashboardStats() { return await this.request('/reportes/dashboard'); },
    async getInventario() { return await this.request('/reportes/inventario'); },
    async getReporteVentas(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await this.request(`/reportes/ventas${qs ? `?${qs}` : ''}`);
    },

    // ---- 9. CARRITO ----
    getSessionId() {
        let sid = localStorage.getItem('baraton_cart_sid');
        if (!sid) {
            sid = 'cart_' + Math.random().toString(36).substring(2, 12);
            localStorage.setItem('baraton_cart_sid', sid);
        }
        return sid;
    },
    async getCarrito() {
        const user = this.getUsuarioActual();
        const id = user?.id_usuario;
        if (!id) return { items: [], total: 0 };
        return await this.request(`/carrito/${id}`);
    },
    async agregarAlCarrito(id_producto, cantidad = 1) {
        const user = this.getUsuarioActual();
        if (!user?.id_usuario) throw new Error('Debes iniciar sesión para agregar al carrito');
        return await this.request('/carrito/agregar', {
            method: 'POST',
            body: JSON.stringify({ id_usuario: user.id_usuario, id_producto, cantidad })
        });
    },
    async actualizarItemCarrito(id_detalle, cantidad) {
        return await this.request(`/carrito/item/${id_detalle}`, {
            method: 'PUT',
            body: JSON.stringify({ cantidad })
        });
    },
    async eliminarItemCarrito(id_detalle) {
        return await this.request(`/carrito/item/${id_detalle}`, { method: 'DELETE' });
    },
    async vaciarCarrito(id_carrito) {
        return await this.request(`/carrito/vaciar/${id_carrito}`, { method: 'DELETE' });
    }
};

window.API = API;
