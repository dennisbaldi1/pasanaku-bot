require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Datos administrativos por defecto
const QR_ADMINISTRATIVO = "https://pasanaku-bot.onrender.com/assets/qr-admin.png"; // O tu link directo a la imagen del QR
const CUENTA_BANCARIA = "Banco BISA - Cta. Cte. N° 123456789 (Titular: Administrador Pasanaku)";

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
            
            // Limpieza del número de teléfono
            const rawFrom = message.from;
            const from = rawFrom ? rawFrom.replace(/\D/g, '') : null;

            if (from && message.type === 'text') {
                const text = message.text.body.toLowerCase().trim();

                // Menú Principal
                if (text.includes('hola') || text.includes('inicio') || text === 'menu') {
                    const menuMsg = `🤖 *¡Bienvenido al Bot de Pasanaku!*\n\n` +
                        `Escribe la palabra clave de tu consulta:\n\n` +
                        `• *reglas* : Ver reglas de ingreso y pozo.\n` +
                        `• *categorias* : Elegir tu monto de juego (100, 200 o 300 Bs).\n` +
                        `• *qr* : Obtener QR/Cuenta para el pago de la comisión de inscripción (1%).\n` +
                        `• *estado* : Ver el resumen de tus cuotas y retenciones.`;
                    await enviarMensaje(from, menuMsg);
                } 
                // Reglas Generales
                else if (text.includes('reglas') || text.includes('regla')) {
                    const reglasMsg = `📌 *REGLAS GENERALES DEL PASANAKU*\n\n` +
                        `1. *Ingreso en Pareja:* La inscripción es obligatoria de 2 en 2. Cada integrante apadrina al otro, actuando ambos como garantes solidarios del pago total.\n\n` +
                        `2. *Entrega del Pozo y Retenciones:*\n` +
                        `   • *Turnos iniciales/intermedios:* Se entrega el 50% del pozo; el 50% restante queda retenido para cubrir automáticamente tus cuotas futuras.\n` +
                        `   • *Últimos turnos:* Se retiene únicamente el monto exacto equivalente a las cuotas restantes del juego.\n\n` +
                        `3. *Inscripción:* Solo se cobra el 1% del valor de la cuota seleccionada al inicio. Sin cargos fijos ni cobros por cabeza.`;
                    await enviarMensaje(from, reglasMsg);
                } 
                // Categorías de Juego
                else if (text.includes('categoria') || text.includes('categorias')) {
                    const catMsg = `🎲 *CATEGORÍAS DE JUEGO DISPONIBLES*\n\n` +
                        `Elige la categoría en la que deseas inscribirte con tu padrino/ahijado:\n\n` +
                        `1️⃣ *Categoría 100 Bs.* (Comisión inicial 1%: 1 Bs.)\n` +
                        `2️⃣ *Categoría 200 Bs.* (Comisión inicial 1%: 2 Bs.)\n` +
                        `3️⃣ *Categoría 300 Bs.* (Comisión inicial 1%: 3 Bs.)\n\n` +
                        `*Para inscribirte:* Envía la palabra *QR* para realizar el pago de la comisión inicial.`;
                    await enviarMensaje(from, catMsg);
                } 
                // Envío de QR / Cuenta Bancaria
                else if (text.includes('qr') || text.includes('pago') || text.includes('cuenta')) {
                    const qrMsg = `💳 *MÉTODO DE PAGO - COMISIÓN DE INSCRIPCIÓN (1%)*\n\n` +
                        `• Categoría 100 Bs $\rightarrow$ Pagar 1 Bs.\n` +
                        `• Categoría 200 Bs $\rightarrow$ Pagar 2 Bs.\n` +
                        `• Categoría 300 Bs $\rightarrow$ Pagar 3 Bs.\n\n` +
                        `📌 *Datos de la cuenta bancaria:*\n${CUENTA_BANCARIA}\n\n` +
                        `🖼️ *QR Oficial:* ${QR_ADMINISTRATIVO}\n\n` +
                        `*Importante:* Una vez realizado el pago, envía la foto del comprobante indicando el nombre de tu padrino/garante.`;
                    await enviarMensaje(from, qrMsg);
                } 
                // Estado del Participante
                else if (text.includes('estado') || text.includes('saldo')) {
                    const estadoMsg = `🟢 *RESUMEN DE ESTADO*\n\n` +
                        `• *Garante registrado:* [Aparecerá tu pareja asignada]\n` +
                        `• *Categoría:* 100 / 200 / 300 Bs.\n` +
                        `• *Estado del Pozo:* Si ganas el pozo antes del final, se mantendrá la retención correspondiente (50% o cuotas restantes) para tus aportes futuos.`;
                    await enviarMensaje(from, estadoMsg);
                } 
                // Respuesta por defecto
                else {
                    await enviarMensaje(from, "🤖 Hola, no entendí tu mensaje. Escribe *menu* o *reglas* para ver las opciones disponibles.");
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
        console.log(`📤 Intentando responder al número: ${to}`);
        
        await axios.post(
            `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
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
        console.log(`✅ Mensaje enviado exitosamente a ${to}`);
    } catch (error) {
        console.error('Error enviando mensaje:', error.response?.data || error.message);
    }
}
 
app.get('/', (req, res) => {
  res.status(200).send('Servidor activo');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de Pasanaku corriendo en http://localhost:${PORT}`);
});