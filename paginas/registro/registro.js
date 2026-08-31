document.getElementById('formulario-registro').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombres = document.getElementById('nombres').value;
    const correo = document.getElementById('correo_reg').value;
    const contrasena = document.getElementById('contra_reg').value;
    const confirmarContrasena = document.getElementById('contra_conf').value;
    
    if(contrasena !== confirmarContrasena) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    
    console.log('Register attempt:', { nombres, correo });
    alert('Intentando crear cuenta para ' + nombres);
});
