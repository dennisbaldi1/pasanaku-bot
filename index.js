const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. Ruta raíz para mantener el servicio activo
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

// 3. Recepción de Mensajes de WhatsApp y Lógica del Menú
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        if (
            body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from; // Número de teléfono del remitente

            if (message.type === 'text') {
                const userText = message.text.body.trim().toLowerCase();
                const respuesta = generarRespuesta(userText);
                await responderWhatsApp(from, respuesta);
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 4. Flujo de respuestas interactivas de Pasanaku Tech
function generarRespuesta(texto) {
    const menuPrincipal = 
        "🤝 *Bienvenido a Pasanaku Tech*\n" +
        "_Orientación Financiera y Ayuda Mutua_\n\n" +
        "Por favor, responde con el *número* de la opción que deseas consultar:\n\n" +
        "1️⃣ ¿Qué es Pasanaku Tech?\n" +
        "2️⃣ Asesoría Financiera Personalizada\n" +
        "3️⃣ Organización de Pasanakus (Grupos de Ahorro)\n" +
        "4️⃣ Hablar con un Asesor\n\n" +
        "💡 _Escribe *menu* en cualquier momento para volver a ver estas opciones._";

    if (['hola', 'buenas', 'inicio', 'menu', 'menú', '0'].includes(texto)) {
        return menuPrincipal;
    } else if (texto === '1') {
        return (
            "ℹ️ *¿Qué es Pasanaku Tech?*\n\n" +
            "Es una iniciativa de orientación y facilitación financiera diseñada para promover la " +
            "colaboración mutua, el orden económico y la educación patrimonial.\n\n" +
            "Combinamos la tradición del ahorro comunitario con herramientas digitales para " +
            "brindar acompañamiento transparente y estructurado a personas e iniciativas.\n\n" +
            "📌 _Nuestra labor es estrictamente de consultoría y educación, sin intermediación financiera._\n\n" +
            "Escribe *menu* para regresar al inicio."
        );
    } else if (texto === '2') {
        return (
            "📊 *Asesoría Financiera Personalizada*\n\n" +
            "Te ayudamos a estructurar tu economía personal o familiar mediante:\n\n" +
            "• Diagnóstico y presupuesto práctico.\n" +
            "• Planificación de ahorro estratégico a corto y largo plazo.\n" +
            "• Organización patrimonial e inversiones seguras.\n\n" +
            "Escribe *4* si deseas agendar una sesión privada con nuestro asesor."
        );
    } else if (texto === '3') {
        return (
            "👥 *Organización de Pasanakus (Ayuda Mutua)*\n\n" +
            "Te facilitamos herramientas de seguimiento para esquemas colaborativos de ahorro:\n\n" +
            "• Plantillas y herramientas digitales de control de turnos y pagos.\n" +
            "• Modelos de transparencia y reglas claras para los participantes.\n" +
            "• Asesoramiento en la estructuración de grupos de confianza.\n\n" +
            "Escribe *menu* para volver al menú principal."
        );
    } else if (texto === '4') {
        return (
            "👨‍💼 *Atención Personalizada*\n\n" +
            "Un asesor profesional atenderá tus consultas puntuales o te asistirá para agendar una cita.\n\n" +
            "Por favor, déjanos tu *Nombre completo* y una breve descripción de lo que necesitas. " +
            "Te responderemos a la brevedad posible."
        );
    } else {
        return (
            "No entendí tu respuesta. 🤔\n\n" +
            "Por favor escribe un número del *1 al 4* o la palabra *menu* para ver las opciones disponibles."
        );
    }
}

// 5. Función para enviar mensajes mediante la API de Meta
async function responderWhatsApp(to, text) {
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const whatsappToken = process.env.WHATSAPP_TOKEN;

    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            }
        });
    } catch (error) {
        console.error('Error enviando mensaje a WhatsApp:', error.response ? error.response.data : error.message);
    }
}

// 6. Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
