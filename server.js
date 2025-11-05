// Backend/server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());

// Habilitar CORS para tu frontend en Firebase
app.use(cors({
  origin: '*', // En producción, reemplaza con tu dominio de Firebase
  methods: ['GET', 'POST']
}));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend del asistente vocacional funcionando!');
});

// Endpoint de la IA
app.post('/ai', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ response: 'Por favor, envía un mensaje válido.' });
  }

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions', // ✅ Sin espacios
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente vocacional experto. Ayudas a estudiantes a explorar carreras, universidades y opciones académicas según sus intereses, habilidades y metas. Responde de forma clara, alentadora, útil y detallada. Si no estás seguro, sugiere recursos o áreas relacionadas.'
          },
          { role: 'user', content: message.trim() }
        ],
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000 // 12 segundos
      }
    );

    // ✅ Verificar que la API devolvió una respuesta
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('⚠️ Respuesta inesperada de DeepSeek:', response.data);
      return res.status(500).json({
        response: 'No pude generar una respuesta en este momento. ¿Podrías reformular tu pregunta?'
      });
    }

    const aiResponse = response.data.choices[0].message.content.trim();
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Error en /ai:', error.message);
    
    if (error.response) {
      console.error('Estado:', error.response.status);
      console.error('Cuerpo:', error.response.data);
      
      // Mensaje amigable según el tipo de error
      if (error.response.status === 401) {
        return res.status(500).json({ response: 'Error de autenticación con el servicio de IA.' });
      }
      if (error.response.status === 400) {
        return res.status(500).json({ response: 'La solicitud no se pudo procesar. Inténtalo de nuevo.' });
      }
    }

    res.status(500).json({
      response: 'Lo siento, hubo un problema técnico. Por favor, inténtalo más tarde.'
    });
  }
});

const PORT = process.env.PORT || 3000; // Render usa PORT
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});