// ========== PERFIL JS ==========

// --- Navbar scroll effect ---
const barraNav = document.getElementById('barraNav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        barraNav.classList.add('scrolled');
    } else {
        barraNav.classList.remove('scrolled');
    }
});

// --- Menú hamburguesa (Mobile) ---
const btnMenu = document.getElementById('btnMenu');
const navEnlaces = document.getElementById('navEnlaces');

if (btnMenu) {
    btnMenu.addEventListener('click', () => {
        navEnlaces.classList.toggle('nav-abierto');
        btnMenu.classList.toggle('activo');
    });
}

// --- Animaciones Básicas de Botones ---
document.addEventListener('DOMContentLoaded', () => {
    // Editar perfil
    const btnEditar = document.querySelector('.tarjeta-perfil .btn-outline');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            console.log('Abrir modal de edición de perfil');
            // Aquí iría la lógica para abrir un modal
        });
    }

    // Cambiar contraseña
    const btnPass = document.querySelectorAll('.tarjeta-seguridad .btn-outline')[0];
    if (btnPass) {
        btnPass.addEventListener('click', () => {
            console.log('Iniciar flujo de cambio de contraseña');
        });
    }

    // Actualizar Correo de Recuperación
    const btnCorreo = document.querySelector('.tarjeta-seguridad .btn-solid-brown');
    if (btnCorreo) {
        btnCorreo.addEventListener('click', () => {
            const originalText = btnCorreo.textContent;
            btnCorreo.textContent = 'Enviando enlace...';
            btnCorreo.disabled = true;
            
            setTimeout(() => {
                btnCorreo.innerHTML = '✓ Enlace enviado al correo';
                btnCorreo.style.background = '#10b981';
                
                setTimeout(() => {
                    btnCorreo.textContent = originalText;
                    btnCorreo.style.background = '';
                    btnCorreo.disabled = false;
                }, 3000);
            }, 1000);
        });
    }

    // --- Lógica de Pestañas (Sidebar) ---
    const menuItems = document.querySelectorAll('.menu-item');
    const tabs = document.querySelectorAll('.seccion-tab');

    if (menuItems.length > 0 && tabs.length > 0) {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = item.getAttribute('data-target');
                if(!targetId) return;
                e.preventDefault();

                // Remover 'activo' de todos los items
                menuItems.forEach(link => link.classList.remove('activo'));
                // Añadir 'activo' al clickeado
                item.classList.add('activo');

                // Ocultar todos los tabs
                tabs.forEach(tab => tab.classList.remove('activa'));
                // Mostrar el target
                const targetTab = document.getElementById(targetId);
                if(targetTab) {
                    targetTab.classList.add('activa');
                }
            });
        });
    }
});
