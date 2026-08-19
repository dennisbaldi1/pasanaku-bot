const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. Ruta raíz para que UptimeRobot responda 200 OK y se mantenga en VERDE
app.get('/', (req, res) => {
  res.status(200).send('Servidor de Pasanaku Bot activo');
});

// 2. Validación de Webhook para Meta
app.get('/webhook', (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 3. Recepción de Mensajes de WhatsApp y Respuesta Dinámica
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      // Extrae el número REAL de la persona que envió el mensaje
      const from = body.entry[0].changes[0].value.messages[0].from;
      const messageText = body.entry[0].changes[0].value.messages[0].text?.body;

      console.log(`📩 Mensaje recibido de ${from}: ${messageText}`);

      // Envía la respuesta al número del remitente real
      await responderWhatsApp(from, `¡Hola! Recibí tu mensaje: "${messageText}". Tu bot de Pasanaku está activo.`);
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Función auxiliar para enviar mensajes a la API de Meta
async function responderWhatsApp(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.PHONE_NUMBER_ID;

  console.log(`🚀 Intentando responder al número: ${to}`);

  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Mensaje enviado con éxito');
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.response?.data || error.message);
  }
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Pasanaku corriendo en puerto ${PORT}`);
});
