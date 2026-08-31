/**
 * Lógica para la página de Checkout
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Lógica del Header Scroll ---
    const nav = document.getElementById('barraNav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- Lógica de Métodos de Pago ---
    const radiosPago = document.querySelectorAll('input[name="metodo_pago"]');
    const panelTransferencia = document.getElementById('panel-transferencia');
    const panelBilletera = document.getElementById('panel-billetera');
    
    radiosPago.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Remover clase activa de todos los contenedores
            document.querySelectorAll('.opcion-pago').forEach(lbl => {
                lbl.classList.remove('activa');
            });
            
            // Añadir clase activa al seleccionado
            e.target.closest('.opcion-pago').classList.add('activa');
            
            // Ocultar todos los paneles primero
            if (panelTransferencia) panelTransferencia.classList.add('oculto');
            if (panelBilletera) panelBilletera.classList.add('oculto');

            // Mostrar el panel correspondiente
            if (e.target.value === 'transferencia') {
                if (panelTransferencia) panelTransferencia.classList.remove('oculto');
            } else if (e.target.value === 'billetera') {
                if (panelBilletera) panelBilletera.classList.remove('oculto');
            }
        });
    });
    
    // --- Lógica del Input File (Comprobante Transferencia) ---
    const inputArchivo = document.getElementById('comprobante');
    const textoArchivo = document.getElementById('nombre-archivo');
    
    if (inputArchivo) {
        inputArchivo.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                textoArchivo.textContent = this.files[0].name;
                textoArchivo.style.color = '#111827';
            } else {
                textoArchivo.textContent = 'No se ha seleccionado ningún archivo.';
                textoArchivo.style.color = '#4b5563';
            }
        });
    }

    // --- Lógica del Input File (Comprobante Billetera) ---
    const inputArchivoBilletera = document.getElementById('comprobante-billetera');
    const textoArchivoBilletera = document.getElementById('nombre-archivo-billetera');
    
    if (inputArchivoBilletera) {
        inputArchivoBilletera.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                textoArchivoBilletera.textContent = this.files[0].name;
                textoArchivoBilletera.style.color = '#111827';
            } else {
                textoArchivoBilletera.textContent = 'No se ha seleccionado ningún archivo.';
                textoArchivoBilletera.style.color = '#4b5563';
            }
        });
    }
});
