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
            "• *Entrega del Pozo Completo:* Se elimina cualquier tipo de retención porcentual sobre el pozo ganado. El participante recibe el *100% del monto acumulado* en su turno correspondiente.\n\n" +
            "• *Fondo de Emergencia (50 Bs):* Cada participante aporta un depósito de garantía de *50 Bs*, destinado a cubrir imprevistos en caso de retraso en los pagos de algún miembro. _Este monto se devuelve íntegramente al finalizar el ciclo del juego._\n\n" +
            "• *Ingreso en Pareja (Padrinazgo):* El registro se realiza de 2 en 2. Cada participante ingresa con su ahijado/padrino, actuando como garantes mutuos para asegurar el cumplimiento del juego.\n\n" +
            "• *Sorteo de Turnos:* Al completarse el grupo, se asignará un número a cada participante. El orden de los turnos se determinará mediante un sorteo transparente con app aleatoria (ej. *Equipo #1 Cat. A - Juan Pérez N° 7* / *Equipo #5 Cat. B - Juan de los Palotes N° 9*).\n\n" +
            "• *Comisión de Plataforma:* 1% único sobre el valor de la cuota inicial de la categoría elegida.\n\n" +
            "Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar."
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO Y MODO DE INGRESO*\n\n" +
            "Selecciona la categoría en la que deseas participar (responde con la letra):\n\n" +
            "A) *Categoría 100 BS*\n" +
            "   • Cuota inicial: 100 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 1 Bs\n" +
            "   • Total a depositar al inicio: *151 Bs*\n\n" +
            "B) *Categoría 200 BS*\n" +
            "   • Cuota inicial: 200 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 2 Bs\n" +
            "   • Total a depositar al inicio: *252 Bs*\n\n" +
            "C) *Categoría 300 BS*\n" +
            "   • Cuota inicial: 300 Bs | Fondo Garantía: 50 Bs | Comisión (1%): 3 Bs\n" +
            "   • Total a depositar al inicio: *353 Bs*\n\n" +
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
            `• Desglose del pago inicial: ${detalle}\n` +
            `_(Recuerda que los 50 Bs del Fondo de Emergencia se te devuelven al finalizar el ciclo)._\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje los siguientes datos:\n\n" +
            "1. Tu Nombre Completo\n" +
            "2. Tu CI / Documento\n" +
            "3. Nombre Completo de tu Padrino/Garante\n" +
            "4. Número de WhatsApp de tu Padrino/Garante\n\n" +
            "📩 *Envío de QR:* Una vez recibidos tus datos, el equipo administrativo te enviará por este medio el código QR oficial con el monto exacto correspondiente a tu categoría para habilitar tu lugar."
        );

    } else if (texto === '3') {
        return (
            "👨‍💼 *ATENCIÓN AL CLIENTE / SOPORTE*\n\n" +
            "Un responsable administrativo te atenderá de manera directa.\n\n" +
            "Por favor, déjanos tu *Nombre completo* y la consulta o trámite que deseas realizar (dudas sobre el juego, comprobantes de pago o sorteos). Te responderemos a la brevedad posible."
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
