// Manejo de login
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    username: form.username.value,
    password: form.password.value
  };

  try {
    const resp = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:     JSON.stringify(data)
    });

    if (!resp.ok) {
      alert('Usuario o contraseña incorrectos');
      return;
    }

    const result = await resp.json();
    
    // Guarda datos en localStorage
    localStorage.setItem('userId',   result.id);
    localStorage.setItem('username', result.username);
    localStorage.setItem('userEmail', result.email);
    localStorage.setItem('role',     result.role);
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Error en login:', err);
    alert('Error de conexión');
  }
});
