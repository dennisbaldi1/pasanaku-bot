require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Verificación del Webhook para Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verificado con éxito por Meta');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 2. Recepción de mensajes de WhatsApp
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;

            if (message.type === 'text') {
                const text = message.text.body.toLowerCase();

                if (text.includes('estado') || text.includes('saldo')) {
                    await enviarMensaje(from, "🟢 *Pasanaku Semanal*\n\n• Cuota: 100 Bs.\n• Garantía (50%): 500 Bs.\n• Estado: Al día.\n\nEnvía la foto de tu comprobante QR del Domingo.");
                } else {
                    await enviarMensaje(from, "🤖 ¡Hola! Soy tu Bot de Pasanaku.\n\nEscribe *estado* para ver tu resumen o envía la foto de tu pago dominical.");
                }
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// 3. Función para enviar mensajes vía WhatsApp Cloud API
async function enviarMensaje(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('Error enviando mensaje:', error.response?.data || error.message);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Pasanaku corriendo en http://localhost:${PORT}`);
});