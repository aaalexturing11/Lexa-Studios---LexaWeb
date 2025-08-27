  document.querySelector('.formulario-contacto form')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        user_id: Number(localStorage.getItem('userId')) || null,
        name:    form.name.value,
        email:   form.email.value,
        subject: form.subject?.value || null,
        message: form.message.value
      };
      try {
        const res = await fetch('/api/contact_messages', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        alert('Mensaje enviado con éxito 🎉');
        form.reset();
      } catch (err) {
        console.error(err);
        alert('Error al enviar el mensaje');
      }
    });