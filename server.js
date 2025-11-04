// Backend/server.js
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: '*', // Flexible para desarrollo local
  methods: ['GET', 'POST']
}));

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('¡Backend funcionando!');
});

// Endpoint de la IA
app.post('/ai', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ response: 'El campo "message" es requerido.' });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions', // ✅ SIN ESPACIOS
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Eres un asistente vocacional que ayuda a estudiantes a explorar carreras y universidades.' },
          { role: 'user', content: message }
        ],
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error en /ai:', error.message);
    if (error.response) {
      console.error('Respuesta de DeepSeek:', error.response.status, error.response.data);
    }
    res.status(500).json({ response: 'Hubo un error al procesar tu solicitud.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});