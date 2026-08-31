document.getElementById('formulario-acceso').addEventListener('submit', function(e) {
    e.preventDefault();
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    
    if(correo && contrasena) {
        console.log('Login attempt:', { correo });
        // Add actual login logic here
        alert('Intentando iniciar sesión con ' + correo);
    }
});
