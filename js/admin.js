document.addEventListener('DOMContentLoaded', () => {
  loadAdmins();
  loadMessages();
  setupNewAdminForm();
});

async function loadAdmins() {
  const tbody = document.getElementById('admins-table-body');
  if (!tbody) {
    console.error('No existe <tbody id="admins-table-body"> en el DOM.');
    return;
  }
  tbody.innerHTML = ''; 

  try {
    const resp = await fetch('/api/admins', {
      method: 'GET',
      credentials: 'include' 
    });
    if (!resp.ok) {
      console.error('Error al obtener administradores. Status:', resp.status);
      return;
    }

    const admins = await resp.json();
    console.log('Admins recibidos del servidor:', admins);
    if (!Array.isArray(admins) || admins.length === 0) {
      console.warn('No hay administradores para mostrar.');
    }

    admins.forEach(admin => {
      const tr = document.createElement('tr');

      // Columna ID
      const tdId = document.createElement('td');
      tdId.textContent = admin.id;
      tr.appendChild(tdId);

      // Columna Username
      const tdUser = document.createElement('td');
      tdUser.textContent = admin.username;
      tr.appendChild(tdUser);

      // Columna Email
      const tdEmail = document.createElement('td');
      tdEmail.textContent = admin.email;
      tr.appendChild(tdEmail);

      // Columna Fecha de creación
      const tdDate = document.createElement('td');
      tdDate.textContent = admin.created_at || '';
      tr.appendChild(tdDate);

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error en loadAdmins():', err);
  }
}

function setupNewAdminForm() {
  const newAdminForm = document.getElementById('form-new-admin');
  if (!newAdminForm) {
    console.error('No existe el formulario #form-new-admin en el DOM.');
    return;
  }
  const feedbackDiv = document.getElementById('new-admin-feedback');

  newAdminForm.addEventListener('submit', async e => {
    e.preventDefault();
    feedbackDiv.textContent = '';

    const form = e.target;
    const data = {
      username: form.username.value.trim(),
      email:    form.email.value.trim(),
      password: form.password.value,
      role:     form.role.value // "1"
    };

    try {
      const resp = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      });

      if (resp.ok) {
        feedbackDiv.style.color = 'lightgreen';
        feedbackDiv.textContent = '¡Administrador creado con éxito!';
        form.reset();
        await loadAdmins(); // recarga la lista tras crear uno nuevo
      } else {
        const err = await resp.json();
        feedbackDiv.style.color = 'salmon';
        feedbackDiv.textContent = 'Error creando admin: ' + (err.error || resp.status);
      }
    } catch (err) {
      console.error('Error al crear admin:', err);
      feedbackDiv.style.color = 'salmon';
      feedbackDiv.textContent = 'Error de conexión.';
    }
  });
}
/** ──────────────────────────────────────────────────────────────
 *  Función: loadMessages
 *  Descripción:
 *    - Hace GET a /api/contact_messages para obtener todos los mensajes.
 *    - Inyecta cada uno dentro de <tbody class="contenedor-tabla">.
 *    - Configura listeners para cambiar estado, borrar y descargar.
 *  ────────────────────────────────────────────────────────────── */
async function loadMessages() {
  try {
    const res = await fetch('/api/contact_messages', {
      credentials: 'include'   // envía cookie de sesión
    });
    if (!res.ok) throw new Error(await res.text());
    const messages = await res.json();
    const tbody = document.querySelector('.contenedor-tabla tbody');
    tbody.innerHTML = ''; // limpia tabla

    messages.forEach(msg => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${msg.name}</td>
        <td>${msg.email}</td>
        <td>${msg.message.slice(0, 10)}${msg.message.length > 10 ? '…' : ''}</td>
        <td>${new Date(msg.submitted_at).toLocaleDateString()}</td>
        <td>
          <select data-id="${msg.id}">
            <option value="pending">Pending</option>
            <option value="done">Done</option>
          </select>
          <button class="btn btn-sm btn-danger ms-2" data-delete="${msg.id}">🗑</button>
          <button class="btn btn-sm btn-outline-secondary ms-1" data-download="${msg.id}">📄</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Listener de cambios de estado (cuando se elige "done" en el select, borra el mensaje)
    tbody.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', async e => {
        if (e.target.value === 'done') {
          const id = e.target.dataset.id;
          await fetch(`/api/contact_messages/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          e.target.closest('tr').remove();
        }
      });
    });

    // Listener de borrar manual
    tbody.querySelectorAll('button[data-delete]').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = e.target.dataset.delete;
        await fetch(`/api/contact_messages/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        e.target.closest('tr').remove();
      });
    });

    // Listener de descargar mensaje completo
    tbody.querySelectorAll('button[data-download]').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.target.dataset.download;
        const msg = messages.find(m => m.id == id);
        const text = 
`Mensaje #${msg.id}

Nombre: ${msg.name}
Email:  ${msg.email}

Mensaje:
${msg.message}

Enviado: ${new Date(msg.submitted_at).toLocaleString()}`;
        const blob = new Blob([text], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `contact_message_${id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    });

  } catch (err) {
    console.error('Error cargando mensajes:', err);
  }
}


