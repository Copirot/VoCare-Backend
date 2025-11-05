// Backend/server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.send('¡Backend con Groq funcionando!');
});

app.post('/ai', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ response: 'Por favor, envía un mensaje válido.' });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant', // ✅ Modelo activo y recomendado
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente vocacional experto. Ayudas a estudiantes a explorar carreras, universidades y opciones académicas. Responde de forma clara, útil y alentadora. Sé breve (máximo 3 oraciones).'
          },
          { role: 'user', content: message.trim() }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        stream: false // No usamos streaming en este caso
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
      return res.status(500).json({
        response: 'No pude generar una respuesta. ¿Podrías reformular tu pregunta?'
      });
    }

    const aiResponse = response.data.choices[0].message.content.trim();
    res.json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Error con Groq:', error.message);
    if (error.response?.data) {
      console.error('Detalles:', error.response.data);
    }
    res.status(500).json({
      response: 'Lo siento, hubo un problema. Por favor, inténtalo de nuevo.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});