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
        "3️⃣ Hablar con un Asesor / Soporte\n\n" +
        "💡 _Escribe *Inicio* en cualquier momento para volver a ver estas opciones._";

    if (['hola', 'buenas', 'inicio', '0'].includes(texto)) {
        return menuPrincipal;

    } else if (texto === '1') {
        return (
            "📋 *REGLAS Y FUNCIONAMIENTO DEL PASANAKU*\n\n" +
            "📌 *MECÁNICA DEL JUEGO*\n" +
            "• *Pozo Íntegro (100%):* No existe ninguna retención porcentual sobre tus ganancias. Al llegar tu turno, recibes el pozo completo acumulado.\n" +
            "• *Ingreso en Pareja (Garante Mutuo):* El registro se realiza de 2 en 2 (padrino/ahijado). Ambos actúan como respaldo mutuo para garantizar el cumplimiento de las cuotas.\n" +
            "• *Sorteo Transparente:* Al completarse la sala, se asigna un número a cada participante y se sortea el orden de turnos mediante una app aleatoria (ej. *Equipo #1 Cat. A - Juan Pérez N° 7*).\n\n" +
            "💳 *PAGO E INGRESO SIMPLIFICADO*\n" +
            "• *Cobro Único Centralizado:* No necesitas hacer solicitudes manuales de QR ni pagos por separado. Tras enviar tus datos de registro, la administración te enviará directamente a este chat el QR oficial de pago.\n" +
            "• *Desglose del QR enviado:* El monto del QR incluirá únicamente:\n" +
            "  1. La cuota inicial de la categoría elegida.\n" +
            "  2. El Fondo de Emergencia obligatorio de 50 Bs (*monto 100% reembolsable al finalizar el ciclo* para cubrir eventuales retrasos de miembros).\n" +
            "  3. La comisión única de mantenimiento de la plataforma (1%).\n\n" +
            "Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar."
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO Y MODO DE INGRESO*\n\n" +
            "Selecciona la categoría en la que deseas participar (responde con la letra):\n\n" +
            "A) *Categoría 100 BS*\n" +
            "   • Cuota inicial: 100 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 1 Bs\n" +
            "   • Total en el QR que recibirás: *151 Bs*\n\n" +
            "B) *Categoría 200 BS*\n" +
            "   • Cuota inicial: 200 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 2 Bs\n" +
            "   • Total en el QR que recibirás: *252 Bs*\n\n" +
            "C) *Categoría 300 BS*\n" +
            "   • Cuota inicial: 300 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 3 Bs\n" +
            "   • Total en el QR que recibirás: *353 Bs*\n\n" +
            "📌 *Requisito:* Debes indicar el Nombre y WhatsApp de tu Padrino/Garante registrado.\n\n" +
            "Escribe *Inicio* para volver al menú principal."
        );

    } else if (texto === 'a' || texto === 'b' || texto === 'c') {
        let cat = texto === 'a' ? '100 BS' : texto === 'b' ? '200 BS' : '300 BS';
        let detalle = texto === 'a' 
            ? "100 Bs (Cuota) + 50 Bs (Fondo Emergencia) + 1 Bs (Comisión 1%) = *151 Bs*" 
            : texto === 'b' 
            ? "200 Bs (Cuota) + 50 Bs (Fondo Emergencia) + 2 Bs (Comisión 1%) = *252 Bs*" 
            : "300 Bs (Cuota) + 50 Bs (Fondo Emergencia) + 3 Bs (Comisión 1%) = *353 Bs*";

        return (
            `📝 *SOLICITUD DE REGISTRO - CATEGORÍA ${cat}*\n\n` +
            `Has seleccionado la *Categoría de ${cat}*.\n` +
            `• Desglose consolidado del QR: ${detalle}\n` +
            `_(Los 50 Bs del Fondo de Emergencia se te devuelven al finalizar el ciclo)._\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje los siguientes datos:\n\n" +
            "1. Tu Nombre Completo\n" +
            "2. Tu CI / Documento\n" +
            "3. Nombre Completo de tu Padrino/Garante\n" +
            "4. Número de WhatsApp de tu Padrino/Garante\n\n" +
            "📲 *Próximo paso:* Una vez recibidos tus datos, el equipo administrativo procesará tu registro y te enviará el QR directo a este chat para habilitar tu posición."
        );

    } else if (texto === '3') {
        return (
            "👨‍💼 *ATENCIÓN AL CLIENTE / SOPORTE*\n\n" +
            "Un responsable administrativo te atenderá de manera directa.\n\n" +
            "Por favor, déjanos tu *Nombre completo* y la consulta o trámite que deseas realizar (dudas sobre las reglas, confirmación de pagos o fechas de sorteo). Te responderemos a la brevedad posible."
        );

    } else {
        return (
            "Opción no válida. 🤔\n\n" +
            "Por favor escribe un número del *1 al 3*, o la letra de la categoría (*A, B o C*).\n" +
            "Escribe *Inicio* para ver el menú principal."
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
