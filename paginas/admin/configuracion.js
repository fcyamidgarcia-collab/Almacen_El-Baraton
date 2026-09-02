// CONFIGURACIÓN JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioConfiguracion');
    if (formulario) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Ajustes de la empresa guardados correctamente.');
        });
    }
});
