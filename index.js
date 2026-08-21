const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. Ruta raíz para mantener el servicio activo
app.get('/', (req, res) => {
    res.status(200).send('Servidor de Pasanaku-Tech Bot activo');
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
                const userText = message.text.body.trim();
                const respuesta = generarRespuesta(userText);
                
                if (respuesta) {
                    await responderWhatsApp(from, respuesta);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 4. Flujo de respuestas interactivas de Pasanaku-Tech
function generarRespuesta(textoOriginal) {
    const texto = textoOriginal.toLowerCase();

    // Filtro de cortesías, afirmaciones y modismos locales a ignorar
    const palabrasIgnoradas = [
        'gracias', 'muchas gracias', 'ok', 'okay', 'listo', 'perfecto', 
        'entendido', 'vale', 'de acuerdo', 'genial', 'excelente', 'thumbs_up',
        'super', 'súper', 'chala', 'de lux', 'joya', 'belleza', 'ya', 'ya de una',
        'dale', 'de una', 'buenisimo', 'buenísimo', 'ya esta', 'ya está',
        'ya perfecto', 'ya perfecto muchas gracias', 'perfecto muchas gracias',
        'ya gracias', 'esta bien', 'está bien', 'esperare', 'esperaré', 'yala'
    ];

    if (palabrasIgnoradas.includes(texto)) {
        return null;
    }

    const menuPrincipal = 
        "🤝 *Bienvenido a Pasanaku-Tech*\n" +
        "_Plataforma de Ahorro Colectivo: Pasanaku Digital_\n\n" +
        "Por favor, responde con el *número* de la opción que deseas consultar:\n\n" +
        "1️⃣ ¿Qué es Pasanaku-Tech y Reglas del Juego?\n" +
        "2️⃣ Inscribirse / Entrar al Juego (Categorías)\n" +
        "3️⃣ Hablar con un Asesor / Soporte\n\n" +
        "💡 _Escribe *Inicio* en cualquier momento para volver a ver estas opciones._";

    if (['hola', 'buenas', 'inicio', '0'].includes(texto)) {
        return menuPrincipal;

    } else if (texto === '1') {
        return (
            "📋 *REGLAS Y FUNCIONAMIENTO DE PASANAKU-TECH*\n\n" +
            "🚀 *INNOVACIÓN Y PROPÓSITO FINTECH*\n" +
            "Pasanaku-Tech es un modelo moderno impulsado por tecnología de punta, creado para garantizar un *flujo de capital constante, seguro y fluido*. Digitalizamos la tradición para potenciar tu liquidez con máxima transparencia.\n\n" +
            "⏰ *CRONOGRAMA OPERATIVO DOMINICAL*\n" +
            "• *Ventana de Inscripciones:* De 11:00 AM a 12:00 PM.\n" +
            "  _(Se envían alertas preventivas a las 10:30 AM y 11:30 AM para confirmar registro y pago de plataforma)._\n\n" +
            "• *Ventana de Liquidación y Pagos:* De 19:00 PM a 20:00 PM.\n" +
            "  _(Se envían alertas a las 18:30 PM con el QR del ganador del turno y a las 19:30 PM como recordatorio final de envío de comprobante)._\n\n" +
            "👥 *ORDEN DE REGISTRO Y EQUIPOS (10 MIEMBROS)*\n" +
            "• Los participantes se registran en orden correlativo en salas de **10 miembros**.\n" +
            "• Del #1 al #10 conforman el **Equipo #1**. Al completarse, del #11 al #20 conforman el **Equipo #2**, y así sucesivamente.\n\n" +
            "📌 *MECÁNICA DEL JUEGO*\n" +
            "• *Pozo Íntegro (100%):* Recibes el pozo acumulado de tu turno de forma directa de los participantes.\n" +
            "• *Ingreso en Pareja (Garante Mutuo):* Registro de 2 en 2 (padrino/ahijado), actuando ambos como respaldo del cumplimiento semanal.\n\n" +
            "💡 *HONORARIOS ADMINISTRATIVOS POR EL USO DE LA PLATAFORMA*\n" +
            "• Único pago fijo de **Bs. 3** por participante (vía QR al momento del registro).\n\n" +
            "💳 *PAGO E INGRESO AL SISTEMA*\n" +
            "• Tras enviar tu nombre completo, recibirás el QR por los Bs. 3 de uso de plataforma. Las cuotas semanales de tu categoría se pagan directamente al participante beneficiario en el horario de 19:00 a 20:00 PM los domingos.\n\n" +
            "Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar."
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO EN PASANAKU-TECH*\n\n" +
            "Selecciona la categoría en la que deseas participar (responde con la letra):\n\n" +
            "A) *Categoría 100 BS*\n" +
            "   • Cuota semanal: 100 Bs | Mantenimiento de plataforma: 3 Bs (pago único)\n\n" +
            "B) *Categoría 200 BS*\n" +
            "   • Cuota semanal: 200 Bs | Mantenimiento de plataforma: 3 Bs (pago único)\n\n" +
            "C) *Categoría 300 BS*\n" +
            "   • Cuota semanal: 300 Bs | Mantenimiento de plataforma: 3 Bs (pago único)\n\n" +
            "Escribe *Inicio* para volver al menú principal."
        );

    } else if (texto === 'a' || texto === 'b' || texto === 'c') {
        let cat = texto === 'a' ? '100 BS' : texto === 'b' ? '200 BS' : '300 BS';
        let cuota = texto === 'a' ? '100 Bs' : texto === 'b' ? '200 Bs' : '300 Bs';

        return (
            `📝 *SOLICITUD DE REGISTRO - CATEGORÍA ${cat}*\n\n` +
            `Has seleccionado la *Categoría de ${cat}* en Pasanaku-Tech.\n` +
            `• Cuota del juego: *${cuota}* por semana (pagada directamente al participante de turno el domingo entre 19:00 y 20:00 PM).\n` +
            `• Pago inicial de plataforma: *3 Bs* (único pago vía QR al registrarte en la ventana de 11:00 AM a 12:00 PM).\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje tu:\n\n" +
            "1. Nombre Completo\n\n" +
            "📲 *Próximo paso:* Al enviar tu nombre, te asignaremos correlativamente en el equipo correspondiente de 10 miembros y te enviaremos el QR de 3 Bs."
	} else if (estadoUsuarios[userId] === 'ESPERANDO_NOMBRE') {
        // Captura el nombre SOLO si venía de elegir A, B o C
        estadoUsuarios[userId] = 'REGISTRO_COMPLETADO';
        return (
            "✅ *¡Datos recibidos correctamente!*\n\n" +
            `Hemos registrado el nombre: *${texto.toUpperCase()}*.\n\n` +
            "El equipo administrativo ya ha recibido tu solicitud. En breve nos pondremos en contacto contigo por este mismo chat para enviarte el QR oficial y formalizar tu ingreso al equipo de 10 miembros.\n\n" +
            "💡 _Escribe *Inicio* para ver el menú principal._"
  );

    } else {
        // Cualquier otro texto fuera del flujo no hace NADA
        return null;
    }
        );

    } else if (texto === '3') {
        return (
            "👋 *Atención Personalizada Pasanaku-Tech*\n\n" +
            "Gracias por contactarnos. Mi nombre es el asistente virtual de Pasanaku-Tech.\n\n" +
            "He notificado a un asesor del equipo administrativo. Por favor, déjanos tu *Nombre Completo* y el detalle de tu consulta en este chat. Un ejecutivo se pondrá en contacto contigo a la brevedad posible."
        );

    } else {
        return (
            "👨‍💼 *ATENCIÓN AL CLIENTE / SOPORTE PASANAKU-TECH*\n\n" +
            "Un responsable administrativo te atenderá de manera directa.\n\n" +

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
