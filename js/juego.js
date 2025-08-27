// Cargar highscores con “podio” para los 3 primeros
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/highscores');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json(); // [{ username, score }, …] ya ordenados descendente

    // 1) Referencias al DOM
    const tbody = document.getElementById('scoreboard-body');
    const firstNameEl  = document.getElementById('podio-first-name');
    const firstScoreEl = document.getElementById('podio-first-score');
    const secondNameEl  = document.getElementById('podio-second-name');
    const secondScoreEl = document.getElementById('podio-second-score');
    const thirdNameEl  = document.getElementById('podio-third-name');
    const thirdScoreEl = document.getElementById('podio-third-score');

    // 2) Limpieza de tabla y podio
    tbody.innerHTML = '';
    firstNameEl.textContent = '';
    firstScoreEl.textContent = '';
    secondNameEl.textContent = '';
    secondScoreEl.textContent = '';
    thirdNameEl.textContent = '';
    thirdScoreEl.textContent = '';

    // 3) Extracción top 3 y resto
    const topThree = data.slice(0, 3);
    const resto   = data.slice(3);

    // 4) Crear el podio con los lugares
    const primero  = topThree[0] || { username: '-', score: '-' };
    const segundo  = topThree[1] || { username: '-', score: '-' };
    const tercero  = topThree[2] || { username: '-', score: '-' };

    firstNameEl .textContent = primero.username;
    firstScoreEl.textContent = primero.score;
    secondNameEl .textContent = segundo.username;
    secondScoreEl.textContent = segundo.score;
    thirdNameEl  .textContent = tercero.username;
    thirdScoreEl .textContent = tercero.score;

    // 5) Poner el resto de los lugares normal
    resto.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.username}</td><td>${row.score}</td>`;
      tbody.appendChild(tr);
    });

  } catch (e) {
    console.error('Error cargando highscores:', e);
  }
});

// Chatbot
function toggleChatBox() {
  const chatBox = document.getElementById("chat-box");
  chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
}

function agregarBurbuja(texto, clase, devolver = false) {
  const div = document.createElement("div");
  div.classList.add("chat-bubble", clase);
  div.innerText = texto;
  document.getElementById("chat-messages").appendChild(div);
  if (devolver) return div;
}

function actualizarBurbuja(elem, texto) {
  elem.innerText = texto;
}

async function enviarAGemini() {
  const input = document.getElementById("inputText");
  const mensaje = input.value.trim();
  if (!mensaje) return;

  agregarBurbuja(mensaje, "user");
  input.value = "";

  const espera = agregarBurbuja("⏳ Pensando...", "bot", true);

  try {
    const res = await fetch("/api/chat-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: mensaje })
    });
    const data = await res.json();
    actualizarBurbuja(espera, data.reply || "⚠️ Gemini no respondió.");
  } catch (e) {
    console.error(e);
    actualizarBurbuja(espera, "❌ Error al contactar al Profesor Michi.");
  }
}
