document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombres = document.getElementById('nombres').value;
    const email = document.getElementById('email_reg').value;
    const password = document.getElementById('pass_reg').value;
    const confirmPassword = document.getElementById('pass_conf').value;
    
    if(password !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    
    console.log('Register attempt:', { nombres, email });
    alert('Intentando crear cuenta para ' + nombres);
});
