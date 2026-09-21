const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Memoria temporal en el servidor para rastrear el flujo y registro de usuarios
const estadoUsuarios = {};
const registrosTemporales = {};

// Número telefónico personal del administrador para recibir las alertas
const MI_NUMERO_WHATSAPP = process.env.ADMIN_PHONE_NUMBER || "59175767760";

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

// 4. Flujo de Respuestas y Gestión de Registros / Garantes
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

    // A. EVALUAR SI EL USUARIO ES UN GARANTE RESPONDIENDO UNA SOLICITUD
    const solicitanteId = Object.keys(registrosTemporales).find(
        key => registrosTemporales[key].garante === userId && registrosTemporales[key].paso === 'CONFIRMACION_GARANTE'
    );

    if (solicitanteId) {
        if (texto === 'acepto' || texto.includes('acep')) {
            const registro = registrosTemporales[solicitanteId];

            // 1. Notificación al GARANTE (Usuario 2)
            const msgGarante = 
                "🎉 *¡SOLICITUD CONFIRMADA!*\n\n" +
                `Has aceptado ser el Garante Mutuo de *\({registro.nombre}* para la *Categoría\){registro.categoria}*.\n\n` +
                "📌 *¿Qué sigue ahora?*\n" +
                "Te contactaremos pronto desde nuestro número administrativo para gestionar la habilitación de tu Registro y el pago único de Bs.3 por el uso de la plataforma. Gracias por participar 🤝";
            await responderWhatsApp(userId, msgGarante);

            // 2. Notificación al SOLICITANTE (Usuario 1)
            const msgSolicitante = 
                "🎉 *¡TU GARANTE HA ACEPTADO!*\n\n" +
                `Tu registro para la *Categoría \({registro.categoria}* y el de tu Garante (+\){userId}) están pre-aprobados.\n\n` +
                "📌 *¿Qué sigue ahora?*\n" +
                "Te contactaremos pronto desde nuestro número administrativo para gestionar el pago único de Bs.3 por la administración del Pasanaku Digital. ¡Estás a un paso de empezar!";
            await responderWhatsApp(solicitanteId, msgSolicitante);

            // 3. Alerta de Nuevo Grupo Registrado enviada directamente al Administrador
            const alertaAdmin = 
                "🚨 *NUEVO REGISTRO EN PAREJA COMPLETADO*\n\n" +
                `👤 *Solicitante (1):* ${registro.nombre}\n` +
                `📱 *Teléfono A:* https://wa.me/${solicitanteId}\n` +
                `📊 *Categoría:* ${registro.categoria}\n\n` +
                `🤝 *Garante (2):* https://wa.me/${userId}\n\n` +
                "📌 _Acción requerida: Contactar a ambos números desde el WhatsApp administrativo para solicitar el pago de Bs.3 por cupo._";
            await responderWhatsApp(MI_NUMERO_WHATSAPP, alertaAdmin);

            // Actualizar estados
            estadoUsuarios[solicitanteId] = 'REGISTRO_COMPLETADO';
            estadoUsuarios[userId] = 'REGISTRO_COMPLETADO';
            delete registrosTemporales[solicitanteId];

            return null;

        } else if (texto === 'rechazo' || texto.includes('rechaz')) {
            // Notificar al Solicitante sobre el rechazo
            await responderWhatsApp(solicitanteId, "❌ Tu garante ha rechazado la solicitud. El registro se ha cancelado. Escribe *2* si deseas iniciar un nuevo registro con otro garante.");
            
            delete registrosTemporales[solicitanteId];
            delete estadoUsuarios[solicitanteId];
            
            return "Entendido. Has rechazado la solicitud de garantía para ingresar al registro del Pasanaku Digital.";
        } else {
            return "Por favor, responde únicamente escribiendo *ACEPTO* o *RECHAZO* para procesar la solicitud de tu garante.";
        }
    }

    // B. NAVEGACIÓN GENERAL Y MENÚS
    if (['hola', 'buenas', 'inicio', '0', 'menu', 'menú'].includes(texto)) {
        estadoUsuarios[userId] = 'MENU_PRINCIPAL';
        delete registrosTemporales[userId];
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
            "Pasanaku-Tech es un modelo moderno impulsado por tecnología a la vanguardia, creado para garantizar un flujo de capital constante, seguro y confiable.\n\n" +
            "_Digitalizamos la tradición para potenciar tu liquidez con máxima transparencia._\n\n" +
            "👥 *GRUPOS Y CICLO DEL JUEGO (10 SEMANAS):*\n\n" +
            "• *_Equipos de 10:_* Cada grupo se conforma por exactamente 10 participantes en orden correlativo de registro.\n\n" +
            "• *_Duración:_* Cada ciclo dura 10 semanas consecutivas, asegurando que los 10 integrantes reciban su pozo en turnos semanales.\n\n" +
            "• *_Inicio:_* Un grupo inicia oficialmente su ciclo el mismo domingo tras confirmarse sus 10 miembros participantes.\n\n" +
            "⏰ *CRONOGRAMA OPERATIVO DOMINICAL:*\n\n" +
            "• *Ventana de Inscripciones:* De Lunes a Sábado\n" +
            "  _(Se realizará la organización del grupo o los grupos a conformar las categorías a jugar, y el sorteo correspondiente para que *se inicie el Pasanaku el día Domingo*)._\n\n" +
            "• *Ventana de Liquidación y Pagos:* De 10:00 AM a 10:00 PM.\n" +
            "  _(Se enviarán notificaciones con el código QR del ganador del turno para que realices el pago de la cuota correspondiente, según tu Categoría elegida)._\n\n" +
            "👥 *ORDEN DE REGISTRO Y EQUIPOS (10 MIEMBROS):*\n\n" +
            "• Los participantes se registrarán en pareja para conformar los equipos de *10 miembros*.\n\n" +
            "• Del #1 al #10 conforman el *Equipo #1*. Al completarse, del #11 al #20 conforman el *Equipo #2*, y así sucesivamente.\n\n" +
            "📌 *MECÁNICA DEL JUEGO:*\n\n" +
            "• *Pozo Íntegro (100%):* Recibes el pozo acumulado de tu turno de forma directa de los participantes.\n\n" +
            "• *Ingreso en Pareja (Garante Mutuo):* Registro de 2 en 2 _(Compadre/Comadre)_ actuando ambos como respaldo del cumplimiento semanal.\n\n" +
            "💡 *HONORARIOS ADMINISTRATIVOS POR EL USO DE LA PLATAFORMA:*\n\n" +
            "• Único pago fijo de *Bs. 3* por participante (vía QR al momento del registro).\n\n" +
            "💳 *PAGO E INGRESO AL SISTEMA:*\n\n" +
            "• Tras enviar tu Nombre completo, recibirás el código QR de los Bs.3 por el uso de la plataforma.\n\n" + 
            "• Las cuotas semanales de tu categoría se pagarán directamente al participante beneficiario (de turno) cada Domingo.\n\n" +
            "❓ *PREGUNTAS FRECUENTES (FAQ)*\n\n" +
            "🔹 *¿Cómo se realiza el pago de la cuota semanal?*\n" +
            "Cada domingo, entre las 10:00 AM y las 10:00 PM, la administración notifica el código QR del participante beneficiario del turno. Transfieres tu cuota directamente a su cuenta.\n\n" +
            "🔹 *¿Qué función cumple la cuota de Bs. 3?*\n" +
            "Es un pago único por ciclo correspondiente a los honorarios por el uso de la infraestructura tecnológica, la automatización de notificaciones y la administración del bot(IA) en WhatsApp.\n\n" +
            "🔹 *¿Qué pasa si mi Garante no responde el mensaje?*\n" +
            "El registro permanece en estado pendiente. La pre-aprobación y la asignación del cupo solo se activan cuando el Garante responde la palabra *ACEPTO* en el chat del WhatsApp.\n\n" +
            "🔹 *¿Puedo cambiar de categoría una vez iniciado el ciclo?*\n" +
            "*No*. Una vez iniciado el ciclo de 10 semanas, la categoría elegida (Bs.100, Bs.200 o Bs.300) y la respectiva cuota son fijas, manteniéndose hasta completar la liquidación de los 10 turnos.
            "🎯 _Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar._"
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO EN PASANAKU-TECH*\n\n" +
            "Selecciona la categoría en la que deseas participar *(responde con la letra)*:\n\n" +
            "*A) Categoría Bs.100*\n" +
            "   • Cuota semanal: Bs.100 | Mantenimiento de plataforma: Bs.3 (pago único)\n\n" +
            "*B) Categoría Bs.200*\n" +
            "   • Cuota semanal: Bs.200 | Mantenimiento de plataforma: Bs.3 (pago único)\n\n" +
            "*C) Categoría Bs.300*\n" +
            "   • Cuota semanal: Bs.300 | Mantenimiento de plataforma: Bs.3 (pago único)\n\n" +
            "💡 Elige tu Categoría *A, B* o *C.*\n" + 
            " _Si deseas volver al menú principal, escribe *Inicio*._"
        );

    } else if (texto === 'a' || texto === 'b' || texto === 'c') {
        let cat = texto === 'a' ? 'Bs.100' : texto === 'b' ? 'Bs.200' : 'Bs.300';
        let cuota = texto === 'a' ? 'Bs.100' : texto === 'b' ? 'Bs.200' : 'Bs.300';
        
        registrosTemporales[userId] = { categoria: cat, cuota: cuota, paso: 'PEDIR_NOMBRE' };
        estadoUsuarios[userId] = 'REGISTRO_EN_PROCESO';

        return (
            `📝 *SOLICITUD DE REGISTRO - CATEGORÍA ${cat}*\n\n` +
            `Has seleccionado la *Categoría de ${cat}* en Pasanaku-Tech.\n` +
            `• Cuota del juego: *${cuota}* por semana.\n` +
            `• Pago inicial de plataforma: *Bs.3* (único pago vía QR).\n\n` +
            "Para continuar, responde con tu *NOMBRE y APELLIDO:*"
        );

    } else if (registrosTemporales[userId] && registrosTemporales[userId].paso === 'PEDIR_NOMBRE') {
        registrosTemporales[userId].nombre = textoOriginal;
        registrosTemporales[userId].paso = 'PEDIR_GARANTE';

        return (
            `Gracias, *${textoOriginal}*.\n\n` +
            "📲 *PASO FINAL - GARANTE MUTUO:*\n" +
            "Ingresa el *Número de WhatsApp de tu Garante* (ejemplo: 59170000000 o 70000000):\n\n" +
            "💡 _Le enviaremos una notificación automática a este número para validar la solicitud._"
        );

    } else if (registrosTemporales[userId] && registrosTemporales[userId].paso === 'PEDIR_GARANTE') {
        // Limpiar y formatear número del garante
        let numGarante = textoOriginal.replace(/[^0-9]/g, '');
        if (!numGarante.startsWith('591') && numGarante.length === 8) {
            numGarante = '591' + numGarante;
        }

        if (numGarante.length < 8) {
            return "⚠️ El número ingresado no es válido. Por favor, ingresa un número de teléfono de WhatsApp correcto (ejemplo: 59170000000):";
        }

        registrosTemporales[userId].garante = numGarante;
        registrosTemporales[userId].paso = 'CONFIRMACION_GARANTE';

        // Enviar mensaje automático al Garante (Usuario 2)
        const msgParaGarante = 
            "🚨 *SOLICITUD DE GARANTE - PASANAKU-TECH*\n\n" +
            `Hola compadre/comadre, *\({registrosTemporales[userId].nombre}* (+\){userId}) te ha registrado como su Garante Mutuo para ingresar a la *Categoría ${registrosTemporales[userId].categoria}*.\n\n` +
            "Para confirmar y pre-aprobar el cupo de ambos en el grupo, responde únicamente escribiendo:\n" +
            "👉 *ACEPTO*\n\n" +
            "Si no lo conoces o deseas declinar, responde:\n" +
            "👉 *RECHAZO*";
        
        await responderWhatsApp(numGarante, msgParaGarante);

        return (
            `⏳ *Solicitud enviada a tu Garante (+${numGarante})*.\n\n` +
            "Le hemos enviado una notificación por WhatsApp. En cuanto responda *ACEPTO*, el sistema pre-aprobará el grupo y nos pondremos en contacto contigo para completar el proceso.\n\n" +
            "💡 _Escribe *Inicio* si deseas volver al menú._"
        );

    } else if (texto === '3') {
        estadoUsuarios[userId] = 'ESPERANDO_SOPORTE';
        return (
            "👋 *Atención Personalizada Pasanaku-Tech*\n\n" +
            "Gracias por contactarnos. Mi nombre es: *Pasanaku-Tech, tu Asistente Virtual :)*\n\n" +
            "He notificado a un asesor del equipo administrativo. Por favor, déjanos tu *Nombre y el detalle de tu consulta...* Un ejecutivo se pondrá en contacto contigo a la brevedad posible."
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

    const cleanTo = String(to).replace(/[^0-9]/g, '');

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
                to: cleanTo,
                type: 'text',
                text: { body: text }
            }
        });
        console.log(`✅ Mensaje enviado exitosamente a: ${cleanTo}`);
    } catch (error) {
        console.error('❌ Error enviando mensaje:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

// 6. Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
