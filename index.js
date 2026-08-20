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
                await responderWhatsApp(from, respuesta);
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
    
    const menuPrincipal = 
        "🤝 *Bienvenido a Pasanaku-Tech*\n" +
        "_Plataforma de Ahorro Colectivo y Pasanaku Digital_\n\n" +
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
            "Pasanaku-Tech es un modelo moderno impulsado por tecnología de punta, creado con la finalidad de garantizar un *flujo de capital constante, seguro, altamente fluido y libre de intermediarios tradicionales*. Digitalizamos la tradición para potenciar tu liquidez con máxima transparencia.\n\n" +
            "📅 *CICLOS Y CRONOGRAMA SEMANAL*\n" +
            "• *Día de Operación:* El juego opera en ciclos semanales **empezando y cerrando cada día Domingo**.\n" +
            "• Los domingos se realizan las aperturas de nuevas jugadas y se efectúa el desembolso directo del pozo acumulado al participante correspondiente de la semana.\n\n" +
            "👥 *ESTRUCTURA DE EQUIPOS (10 MIEMBROS)*\n" +
            "• Cada grupo o sala de juego se conforma estrictamente por un **total de 10 miembros participantes**.\n" +
            "• Al completarse los 10 cupos, el sistema habilita automáticamente un nuevo equipo dentro de esa misma categoría.\n" +
            "  - *Ejemplo:* Si en la Categoría 100 Bs se inscriben 12 personas, los primeros 10 conforman el **Equipo #1** y los 2 restantes pasan a liderar el **Equipo #2**.\n\n" +
            "📌 *MECÁNICA DEL JUEGO*\n" +
            "• *Pozo Íntegro (100%):* Recibes el pozo completo acumulado en tu turno sin ninguna retención o descuento sobre tus ganancias.\n" +
            "• *Ingreso en Pareja (Garante Mutuo):* El registro es de 2 en 2 (padrino/ahijado), actuando ambos como respaldo para garantizar el pago puntual de las cuotas.\n" +
            "• *Sorteo Transparente:* Al completarse la sala de 10 miembros, se asigna un número a cada participante y se sortea el orden de turnos mediante una app aleatoria (ej. *Equipo #1 Cat. A - Juan Pérez N° 7*).\n\n" +
            "🛡️ *DETALLE DEL FONDO DE EMERGENCIA (50 BS)*\n" +
            "• *Propósito:* Es un pozo de reserva colectivo destinado a respaldar el juego si algún participante sufre un imprevisto y se retrasa en su cuota, garantizando que el ganador del turno reciba su dinero el domingo a tiempo.\n" +
            "• *Devolución Total:* Es un depósito en garantía que se te reembolsa al 100% al finalizar exitosamente el ciclo del juego.\n\n" +
            "💡 *EXPLICACIÓN DE LA COMISIÓN ÚNICA DEL 1%*\n" +
            "• Corresponde al mantenimiento y administración de la plataforma Pasanaku-Tech. Se calcula únicamente sobre la cuota inicial de la categoría elegida.\n" +
            "• *Ejemplo Práctico:* En la Categoría de 200 Bs, el 1% es *2 Bs*. Pagas 200 Bs (cuota) + 50 Bs (fondo) + 2 Bs (comisión) = *252 Bs* en tu primer depósito. En los siguientes turnos solo pagas tu cuota de 200 Bs.\n\n" +
            "💳 *PAGO E INGRESO SIMPLIFICADO*\n" +
            "• Tras enviar tus datos de registro, la administración te enviará directamente a este chat el QR oficial consolidado con el monto exacto correspondiente.\n\n" +
            "Escribe *2* para ver las categorías disponibles e inscribirte o *Inicio* para regresar."
        );

    } else if (texto === '2') {
        return (
            "🎮 *CATEGORÍAS DE JUEGO EN PASANAKU-TECH*\n\n" +
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
            `Has seleccionado la *Categoría de ${cat}* en Pasanaku-Tech.\n` +
            `• Desglose consolidado del QR: ${detalle}\n` +
            `_(Los 50 Bs del Fondo de Emergencia se devuelven al finalizar el ciclo)._\n\n` +
            "Para completar tu inscripción, envía en un solo mensaje tu:\n\n" +
            "1. Nombre Completo\n\n" +
            "📲 *Próximo paso:* Una vez recibido tu nombre, el equipo administrativo procesará tu registro, te asignará a un equipo de 10 miembros y te enviará el QR directo a este chat."
        );

    } else if (texto === '3') {
        return (
            "👨‍💼 *ATENCIÓN AL CLIENTE / SOPORTE PASANAKU-TECH*\n\n" +
            "Un responsable administrativo te atenderá de manera directa.\n\n" +
            "Por favor, déjanos tu *Nombre completo* y la consulta o trámite que deseas realizar (dudas sobre el cronograma dominical, confirmación de pagos o fechas de sorteo). Te responderemos a la brevedad posible."
        );

    } else {
        // Captura cualquier texto o nombre enviado
        return (
            "✅ *¡Registro Recibido!*\n\n" +
            `Hemos registrado el nombre: *${textoOriginal}*.\n\n` +
            "El equipo administrativo procesará tu inscripción para asignarte a un equipo de 10 miembros. En breve te enviaremos por este chat el código QR correspondiente para formalizar tu lugar.\n\n" +
            "💡 _Escribe *Inicio* en cualquier momento para volver al menú principal._"
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
