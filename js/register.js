// Manejo de registro
document.getElementById('form-register').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    username: form.username.value,
    email:    form.email.value,
    password: form.password.value,
    role:     form.role.value
  };

  try {
    const resp = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });

    if (resp.ok) {
      alert('¡Registrado con éxito!');
      window.location.href = 'inicioSesion.html';
    } else {
      const err = await resp.json();
      alert('Error al registrar: ' + (err.error || resp.status));
    }
  } catch (err) {
    console.error('Error en registro:', err);
    alert('Error de conexión');
  }
});
