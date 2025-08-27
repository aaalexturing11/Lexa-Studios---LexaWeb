require('dotenv').config();
const express      = require('express');
const path         = require('path');
const sql          = require('mssql');
const cookieParser = require('cookie-parser');
const cors         = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('ENV:', {
  DB_USER:     process.env.DB_USER,
  DB_PASS:     process.env.DB_PASS ? '***' : undefined,
  DB_SERVER:   process.env.DB_SERVER,
  DB_DATABASE: process.env.DB_DATABASE
});

const app = express();
const PORT = process.env.PORT || 3000;

// Servir estáticos desde la raíz de LEXA-Studios
app.use(express.static(path.join(__dirname, '..')));
app.use(cors({
  origin: 'https://lexa-web.onrender.com',  
}));

// Para parsear JSON en body
app.use(express.json());
// Para parsear formularios HTML (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

const dbConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options:  { encrypt: true }
};

// ————— Expresión regular para validar contraseña —————
//   • Mínimo 8 caracteres
//   • Al menos una mayúscula
//   • Al menos una minúscula
//   • Al menos un número
//   • Al menos un carácter especial
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// --- API ---

app.get('/api/admins', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().execute('dbo.usp_GetAdmins');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ error: 'Error al obtener administradores' });
  }
});


// ping
app.get('/api/ping', (req, res) => {
  res.json({ pong: true });
});

// register
app.post('/api/register', async (req, res) => {
  try {
    console.log('🔔 /api/register body:', req.body);
    const { username, email, password, role } = req.body;

    // Validar que la contraseña cumpla con el formato requerido
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial.'
      });
    }

    // Llamada al sp
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('username', sql.NVarChar(50),  username)
      .input('email',    sql.NVarChar(255), email)
      .input('password', sql.NVarChar(100), password)
      .input('role_id',  sql.Int,           parseInt(role, 10))
      .execute('dbo.usp_RegisterUser');

    console.log('Usuario registrado');
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    console.error('Error en /api/register:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// login
app.post('/api/login', async (req, res) => {
  try {
    console.log('/api/login body:', req.body);
    const { username, password } = req.body;

    const pool     = await sql.connect(dbConfig);
    const loginReq = pool.request()
      .input('username', sql.NVarChar(50),  username)
      .input('password', sql.NVarChar(100), password);

    const result = await loginReq.execute('dbo.usp_Login');
    const users  = result.recordset;
    if (!users.length) {
      console.warn('Credenciales inválidas para:', username);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user    = users[0];
    const expires = new Date(Date.now() + 24*60*60*1000);

    // Crear sesión vía SP usp_CreateSession (sin usar)
    const sessionReq = pool.request()
      .input('user_id',    sql.Int,        user.id)
      .input('expires_at', sql.DateTime2,  expires)
      .output('out_token', sql.UniqueIdentifier);

    await sessionReq.execute('dbo.usp_CreateSession');
    const token = sessionReq.parameters.out_token.value;

    res.cookie('session_token', token, {
      httpOnly: true,
      secure:   true,        // para producción sobre HTTPS y que funcione el certificado
      sameSite: 'none',      // para que funcione cross-site
      expires
    });

    console.log('Login exitoso:', user.username);
    res.json({
      id:       user.id,
      username: user.username,
      email:    user.email,
      role:     user.role
    });
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
});

// listar mensajes
app.get('/api/contact_messages', async (req, res) => {
  try {
    const pool   = await sql.connect(dbConfig);
    const result = await pool.request()
      .execute('dbo.usp_GetContactMessages');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// crear mensaje
app.post('/api/contact_messages', async (req, res) => {
  try {
    const { user_id, name, email, subject, message } = req.body;
    const pool   = await sql.connect(dbConfig);
    const cmReq  = pool.request()
      .input('user_id',  sql.Int,            user_id || null)
      .input('name',     sql.NVarChar(100),  name)
      .input('email',    sql.NVarChar(255),  email)
      .input('subject',  sql.NVarChar(150),  subject  || null)
      .input('message',  sql.NVarChar(sql.MAX), message)
      .output('out_id',  sql.Int);

    await cmReq.execute('dbo.usp_CreateContactMessage');
    const newId = cmReq.parameters.out_id.value;
    res.status(201).json({ id: newId });
  } catch (err) {
    console.error('Error creating message:', err);
    res.status(500).json({ error: 'Error creando mensaje' });
  }
});

// borrar mensaje
app.delete('/api/contact_messages/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .execute('dbo.usp_DeleteContactMessage');
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Error borrando mensaje' });
  }
});

// highscore: crear
app.post('/api/highscores', async (req, res) => {
  console.log('[POST /api/highscores] body:', req.body);
  const { game_id, score, username } = req.body;

  if (
    typeof game_id !== 'number' ||
    typeof score   !== 'number' ||
    typeof username !== 'string'
  ) {
    return res.status(400).json({ error: 'game_id, score y username son requeridos' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('username', sql.NVarChar(50), username)
      .input('game_id',  sql.Int,         game_id)
      .input('score',    sql.Int,         score)
      .execute('dbo.usp_CreateHighscoreWithUser');

    console.log(`Highscore guardado: ${username} – ${score}`);
    res.status(201).json({ message: 'Highscore guardado' });
  } catch (err) {
    console.error('Error guardando highscore:', err.stack);
    res.status(500).json({ error: 'Error guardando highscore' });
  }
});

// highscore: listar top N
app.get('/api/highscores', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('TopN', sql.Int, 10)
      .execute('dbo.usp_GetTopHighscores');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching highscores:', err.stack);
    res.status(500).json({ error: 'Error al obtener highscores' });
  }
});

// —————— Finalmente tu fallback para servir el front ——————
app.get(/^\/(?!api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API + Front corriendo en http://localhost:${PORT}`);
});

// Gemini
app.post("/api/chat-gemini", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("Pregunta recibida para Gemini:", userMessage);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: `Eres un gato profesor sabio y simpático llamado Profesor Michi, parte del universo del videojuego Campus Bonanza. Tu papel es actuar como asistente virtual para los jugadores y visitantes curiosos, respondiendo preguntas frecuentes sobre el juego y sobre LEXA Studios.

    Campus Bonanza es un videojuego tipo RPG educativo, diseñado por estudiantes del Tecnológico de Monterrey y desarrollado por LEXA Studios. El objetivo principal del juego es que los estudiantes mejoren el entorno de su campus participando activamente en la detección y resolución de incidencias reales como basura tirada, objetos descompuestos o espacios dañados. Esto se realiza mediante minijuegos interactivos distribuidos en distintas zonas del campus.

    FUNCIONAMIENTO:
    - El jugador se desplaza por distintas áreas del campus (renderizadas en Unity WebGL).
    - Al encontrar una incidencia, se activa un minijuego.
    - Al completarlo, el jugador gana puntos, que se acumulan en un sistema de puntuación global (Scoreboard).
    - Los puntos pueden ser usados en una tienda de power-ups (mejoras que ayudan en minijuegos futuros).
    - El juego es accesible desde el navegador y está optimizado para WebGL.
    - Se requiere registro para guardar el progreso en el ranking.

    LEXA Studios es el equipo detrás del juego. Su misión es crear experiencias interactivas con impacto social, especialmente en ambientes universitarios. Su visión es usar la tecnología y el diseño centrado en el usuario para fomentar el aprendizaje, la colaboración y el sentido de comunidad.

    Solo debes responder sobre Campus Bonanza, su jugabilidad, reglas, objetivos, avances, minijuegos, la puntuación, el sistema de power-ups, y sobre LEXA Studios. Si te preguntan por temas fuera del juego o de la empresa, responde con algo simpático como: "¡Eso no está en mi libro de clases, joven estudiante!".

    Usa un tono tierno, claro, divertido y siempre firma tus respuestas con: "~ Prof. Michi 🐾".`
            }
          ]
        }
      ]
    });
    const result = await chat.sendMessage(userMessage);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Error al consultar Gemini:", error);
    res.status(500).json({ error: "Error al procesar la solicitud con Gemini." });
  }
});
