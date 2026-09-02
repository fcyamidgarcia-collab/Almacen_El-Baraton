// REPORTES JS (ESPAÑOL)
document.addEventListener('DOMContentLoaded', () => {
    const btnPDF = document.getElementById('btnDescargarPDF');
    if (btnPDF) {
        btnPDF.addEventListener('click', () => {
            alert('Generando y descargando informe consolidado en PDF...');
        });
    }
});
