document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(email && password) {
        console.log('Login attempt:', { email });
        // Add actual login logic here
        alert('Intentando iniciar sesión con ' + email);
    }
});
