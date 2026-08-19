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

// 3. Recepción de Mensajes de WhatsApp
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
            const from = message.from;

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
        "_Plataforma de Ahorro Colectivo y Pasanaku Digital_\n\n" +
        "Por favor, responde con el *número* de la opción que deseas consultar:\n\n" +
        "1️⃣ ¿Qué es Pasanaku Tech y Reglas del Juego?\n" +
        "2️⃣ Inscribirse / Entrar al Juego (Categorías)\n" +
        "3️⃣ Solicitar QR de Pago de Comisión (1%)\n" +
        "4️⃣ Hablar con un Asesor / Soporte\n\n" +
        "💡 _Escribe *menu* en cualquier momento para volver a ver estas opciones._";

    if (['hola', 'buenas', 'inicio', 'menu', 'menú', '0'].includes(texto)) {
        return menuPrincipal;

    } else if (texto === '1') {
        return (
            "📋 *REGLAS Y FUNCIONAMIENTO DEL PASANAKU*\n\n" +
            "• *Ingreso en Pareja (Padrinazgo):* El registro es de 2 en 2. Cada participante debe ingresar con su ahijado/padrino, actuando mutuamente como garantes para asegurar el pago total de sus cuotas.\n\n" +
            "• *Comisión de Plataforma:* Sin cobros fijos administrativos ni por cabeza. Únicamente se abona una comisión inicial del *1% del valor de la cuota* de la categoría elegida.\n\n" +
            "• *Entrega del Pozo:* Al recibir el pozo en tu turno designado:\n" +
            "  - *Turnos iniciales/medios:* Recibirás el *50% efectivo* del pozo. El 50% restante se retiene para cubrir de forma garantizada tus aportes futuros.\n" +
            "  - *Turnos finales:* Se retendrá únicamente el porcentaje justo para cubrir los turnos restantes, entregándote el saldo completo disponible.\n\n" +
            "Escribe *2* para ver las categorías disponibles e inscribirte."
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO Y MODO DE INGRESO*\n\n" +
            "Selecciona la categoría en la que deseas participar (responde con la letra):\n\n" +
            "A) *Categoría 100 BS* (Cuota: 100 Bs | Comisión 1%: 1 Bs)\n" +
            "B) *Categoría 200 BS* (Cuota: 200 Bs | Comisión 1%: 2 Bs)\n" +
            "C) *Categoría 300 BS* (Cuota: 300 Bs | Comisión 1%: 3 Bs)\n\n" +
            "📌 *Requisito Obligatorio:* Para completar tu registro debes indicar el Nombre y WhatsApp de tu Padrino/Garante registrado.\n\n" +
            "Escribe *menu* para volver al inicio."
        );

    } else if (texto === 'a' || texto === 'b' || texto === 'c') {
        let cat = texto === 'a' ? '100 BS' : texto === 'b' ? '200 BS' : '300 BS';
        let comision = texto === 'a' ? '1 BS' : texto === 'b' ? '2 BS' : '3 BS';

        return (
            `📝 *REGISTRO EN CATEGORÍA ${cat}*\n\n` +
            `Has seleccionado la *Categoría de ${cat}*.\n` +
            `• Comisión inicial de mantenimiento (1%): *${comision}*\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje los siguientes datos:\n\n" +
            "1. Tu Nombre Completo\n" +
            "2. Tu CI / Documento\n" +
            "3. Nombre Completo de tu Padrino/Garante\n" +
            "4. Número de WhatsApp de tu Padrino/Garante\n\n" +
            "Un administrador validará la información de la pareja y te enviará el QR de pago."
        );

    } else if (texto === '3') {
        return (
            "💳 *SOLICITUD DE QR DE PAGO / COMISIÓN*\n\n" +
            "Por favor, indica tu nombre completo y la categoría en la que te inscribiste.\n\n" +
            "El equipo administrativo te enviará por este medio el QR / Cuenta Bancaria para abonar la comisión del 1% y habilitar tu posición en la tabla del Pasanaku.\n\n" +
            "Escribe *4* si requieres atención directa."
        );

    } else if (texto === '4') {
        return (
            "👨‍💼 *ATENCIÓN AL CLIENTE / ADMINISTRACIÓN*\n\n" +
            "Un responsable administrativo te atenderá de manera directa.\n\n" +
            "Por favor, déjanos tu *Nombre completo* y la consulta o trámite que deseas realizar (inscripción de parejas, envío de comprobante QR o dudas). Te responderemos a la brevedad."
        );

    } else {
        return (
            "Opción no válida. 🤔\n\n" +
            "Por favor escribe un número del *1 al 4*, o la letra de la categoría (*A, B o C*).\n" +
            "Escribe *menu* para ver el menú principal."
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
