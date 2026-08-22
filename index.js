const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Memoria temporal en el servidor para rastrear el flujo de cada usuario
const estadoUsuarios = {};

// Número telefónico personal del administrador para recibir las alertas
const MI_NUMERO_WHATSAPP = "59175767760";

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
            const from = message.from; // Número del participante

            if (message.type === 'text') {
                const userText = message.text.body.trim();
                const respuesta = await procesarMensaje(from, userText);
                
                if (respuesta !== null) {
                    await responderWhatsApp(from, respuesta);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 4. Flujo de Respuestas y Notificación al Administrador
async function procesarMensaje(userId, textoOriginal) {
    const texto = textoOriginal.toLowerCase();

    // Filtro de cortesías a ignorar
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

    if (['hola', 'buenas', 'inicio', '0', 'menu', 'menú'].includes(texto)) {
        estadoUsuarios[userId] = 'MENU_PRINCIPAL';
        return (
            "🤝 *Bienvenido a Pasanaku-Tech:*\n\n" +
            "_Una Plataforma de Ahorro Colectivo.- Pasanaku Digital_\n\n" +
            "Por favor, responde con el *número* de la opción que deseas consultar:\n\n" +
            "1️⃣ ¿Qué es Pasanaku-Tech y Reglas del Juego?\n" +
            "2️⃣ Inscribirse / Entrar al Juego (Categorías)\n" +
            "3️⃣ Hablar con un Asesor / Soporte\n\n" +
            "💡 _Escribe *Inicio* en cualquier momento para volver a ver estas opciones._"
        );
    }

    if (estadoUsuarios[userId] === 'EN_ATENCION_HUMANA' || estadoUsuarios[userId] === 'REGISTRO_COMPLETADO') {
        return null;
    }

    if (texto === '1') {
        return (

            "📋 *REGLAS Y FUNCIONAMIENTO DE PASANAKU-TECH*\n\n" +
            "🚀 *INNOVACIÓN Y PROPÓSITO:*\n" +
            "Pasanaku-Tech es un modelo moderno impulsado por tecnología de punta, creado para garantizar un flujo de capital constante, seguro y fluido.\n\n" +
            "_Digitalizamos la tradición para potenciar tu liquidez con máxima transparencia._\n\n" +
            "👥 *GRUPOS Y CICLO DEL JUEGO (10 SEMANAS):*\n\n" +
            "• *_Equipos de 10:_*  Cada grupo se conforma por exactamente 10 participantes en orden correlativo de registro.\n\n" +
            "• *_Duración:_*  Cada ciclo dura 10 semanas consecutivas, asegurando que los 10 integrantes reciban su pozo en turnos semanales.\n\n" +
            "• *_Inicio:_*  Un grupo inicia oficialmente su ciclo el mismo domingo tras confirmarse sus 10 miembros participantes.\n\n" +
            "⏰ *CRONOGRAMA OPERATIVO DOMINICAL:*\n\n" +
            "• *Ventana de Inscripciones:* De 11:00 AM a 12:00 PM.\n" +
            "  _(Se envían alertas preventivas a las 10:30 AM y 11:30 AM para confirmar registro y pago de plataforma)._\n\n" +
            "• *Ventana de Liquidación y Pagos:* De 19:00 PM a 20:00 PM.\n" +
            "  _(Se envían alertas a las 18:30 PM con el QR del ganador del turno y a las 19:30 PM como recordatorio final de envío de comprobante)._\n\n" +
            "👥 *ORDEN DE REGISTRO Y EQUIPOS (10 MIEMBROS):*\n\n" +
            "• Los participantes se registran en orden correlativo en equipos de *10 miembros*.\n\n" +
            "• Del #1 al #10 conforman el *Equipo #1*. Al completarse, del #11 al #20 conforman el *Equipo #2*, y así sucesivamente.\n\n" +
            "📌 *MECÁNICA DEL JUEGO:*\n\n" +
            "• *Pozo Íntegro (100%):* Recibes el pozo acumulado de tu turno de forma directa de los participantes.\n\n" +
            "• *Ingreso en Pareja (Garante Mutuo):* Registro de 2 en 2 _(Compadre/Comadre)_ actuando ambos como respaldo del cumplimiento semanal.\n\n" +
            "💡 *HONORARIOS ADMINISTRATIVOS POR EL USO DE LA PLATAFORMA:*\n\n" +
            "• Único pago fijo de *Bs. 3* por participante (vía QR al momento del registro).\n\n" +
            "💳 *PAGO E INGRESO AL SISTEMA:*\n\n" +
            "• Tras enviar tu nombre completo, recibirás el código QR de los Bs. 3 por el uso de la plataforma.\n\n" + 
            "• Las cuotas semanales de tu categoría se pagarán directamente al participante beneficiario en el horario de 19:00 a 20:00 PM. Cada Domingo.\n\n" +
            "🎯 _Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar._"
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
            "💡 _Escribe *Inicio* para volver al menú principal._"
        );

    } else if (texto === 'a' || texto === 'b' || texto === 'c') {
        let cat = texto === 'a' ? '100 BS' : texto === 'b' ? '200 BS' : '300 BS';
        let cuota = texto === 'a' ? '100 Bs' : texto === 'b' ? '200 Bs' : '300 Bs';
        
        estadoUsuarios[userId] = `ESPERANDO_NOMBRE_${cat}`;

        return (
            `📝 *SOLICITUD DE REGISTRO - CATEGORÍA ${cat}*\n\n` +
            `Has seleccionado la *Categoría de ${cat}* en Pasanaku-Tech.\n` +
            `• Cuota del juego: *${cuota}* por semana (pagada directamente al participante de turno el domingo entre 19:00 y 20:00 PM).\n` +
            `• Pago inicial de plataforma: *3 Bs* (único pago vía QR al registrarte en la ventana de 11:00 AM a 12:00 PM).\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje tu:\n\n" +
            "1. Nombre Completo\n\n" +
            "📲 *Próximo paso:* Al enviar tu nombre, te asignaremos correlativamente en el equipo correspondiente de 10 miembros y te enviaremos el QR de 3 Bs."
        );

    } else if (texto === '3') {
        estadoUsuarios[userId] = 'ESPERANDO_SOPORTE';
        return (
            "👋 *Atención Personalizada Pasanaku-Tech*\n\n" +
            "Gracias por contactarnos. Mi nombre es: *Pasanaku-Tech, tu Asistente Virtual :)*\n\n" +
            "He notificado a un asesor del equipo administrativo. Por favor, déjanos tu *Nombre y el detalle de tu consulta...* Un ejecutivo se pondrá en contacto contigo a la brevedad posible."
        );

    } else if (estadoUsuarios[userId] && estadoUsuarios[userId].startsWith('ESPERANDO_NOMBRE_')) {
        const categoria = estadoUsuarios[userId].replace('ESPERANDO_NOMBRE_', '');
        estadoUsuarios[userId] = 'REGISTRO_COMPLETADO';

        // Alerta de Registro enviada directamente a tu teléfono personal
        const alertaAdmin = 
            "🚨 *NUEVO REGISTRO RECIBIDO*\n\n" +
            `👤 *Nombre:* ${textoOriginal}\n` +
            `📱 *Número:* https://wa.me/${userId}\n` +
            `📊 *Categoría:* ${categoria}\n\n` +
            "📌 _Acción requerida: Enviar QR de Bs. 3 para validar cupo._";
        
        await responderWhatsApp(MI_NUMERO_WHATSAPP, alertaAdmin);

        return (
            "✅ *¡Registro Recibido!*\n\n" +
            `Hemos registrado el nombre: *${textoOriginal}*.\n\n` +
            "El equipo administrativo procesará tu inscripción para asignarte en orden de llegada al equipo de 10 miembros correspondientes. En breve te enviaremos por este chat el QR de Bs. 3 por uso de plataforma para oficializar tu lugar.\n\n" +
            "💡 _Escribe *Inicio* en cualquier momento para volver al menú principal._"
        );

    } else if (estadoUsuarios[userId] === 'ESPERANDO_SOPORTE') {
        estadoUsuarios[userId] = 'EN_ATENCION_HUMANA';

        // Alerta de Soporte enviada directamente a tu teléfono personal
        const alertaSoporte = 
            "👨‍💼 *NUEVA SOLICITUD DE SOPORTE*\n\n" +
            `📱 *Número del usuario:* https://wa.me/${userId}\n` +
            `💬 *Mensaje:* "${textoOriginal}"\n\n` +
            "📌 _Acción requerida: Responder directamente a este número._";
        
        await responderWhatsApp(MI_NUMERO_WHATSAPP, alertaSoporte);

        return (
            "✅ *¡Consulta de Soporte Recibida!*\n\n" +
            `Hemos registrado tu mensaje: *"${textoOriginal}"*.\n\n` +
            "Un asesor administrativo revisará tu caso y te responderá de forma directa a la brevedad posible.\n\n" +
            "💡 _Escribe *Inicio* en cualquier momento para volver al menú principal._"
        );

    } else {
        return null;
    }
}

// 5. Función para enviar mensajes mediante la API de Meta
async function responderWhatsApp(to, text) {
    const phoneNumberId = process.env.PHONE_NUMBER_ID;
    const whatsappToken = process.env.WHATSAPP_TOKEN;

    try {
        const response = await axios({
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
        console.log(`✅ Mensaje enviado exitosamente a: ${to}`);
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

// 6. Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
