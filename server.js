// Backend/server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());

// Permitir solicitudes desde tu frontend (Firebase o localhost)
app.use(cors({
  origin: '*', // En producción, cambia '*' por tu dominio de Firebase
  methods: ['GET', 'POST']
}));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Backend con Groq funcionando!');
});

// Endpoint de la IA
app.post('/ai', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ response: 'Por favor, envía un mensaje válido.' });
  }

  try {
    // Petición a Groq (usa Llama 3, 8B)
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192', // Modelo rápido y gratuito
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente vocacional experto. Ayudas a estudiantes a explorar carreras, universidades y opciones académicas. Responde de forma clara, útil y alentadora. Si no sabes algo, sugiere buscar en fuentes oficiales. Sé conciso (máximo 3 oraciones).'
          },
          { role: 'user', content: message.trim() }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('⚠️ Respuesta vacía de Groq:', response.data);
      return res.status(500).json({
        response: 'No pude generar una respuesta. ¿Podrías reformular tu pregunta?'
      });
    }

    const aiResponse = response.data.choices[0].message.content.trim();
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Error con Groq:', error.message);
    if (error.response) {
      console.error('Estado:', error.response.status);
      console.error('Detalles:', error.response.data);
    }
    res.status(500).json({
      response: 'Lo siento, hubo un problema técnico. Por favor, inténtalo de nuevo.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});