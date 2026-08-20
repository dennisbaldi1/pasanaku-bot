// ... (mantiene todo igual hasta la función generarRespuesta)

function generarRespuesta(texto) {
    const menuPrincipal = 
        "🤝 *Bienvenido a Pasanaku-Tech*\n" +
        "_Plataforma de Ahorro Colectivo y Pasanaku Digital_\n\n" +
        "Por favor, responde con el *número* de la opción que deseas consultar:\n\n" +
        "1️⃣ ¿Qué es Pasanaku-Tech y Reglas del Juego?\n" +
        "2️⃣ Inscribirse / Entrar al Juego (Categorías)\n" +
        "3️⃣ Hablar con un Asesor / Soporte\n\n" +
        "💡 _Escribe *Inicio* en cualquier momento para volver a ver estas opciones._";

    // 1. Opciones fijas del menú
    if (['hola', 'buenas', 'inicio', '0'].includes(texto)) {
        return menuPrincipal;
    } else if (texto === '1') {
        // ... (resto del contenido de 1 igual)
        return "📋 *REGLAS Y FUNCIONAMIENTO...*"; // Asegúrate de mantener el texto que ya tenías aquí
    } else if (texto === '2') {
        // ... (contenido de 2 igual)
        return "🎮 *CATEGORÍAS DE JUEGO...*";
    } else if (texto === '3') {
        // ... (contenido de 3 igual)
        return "👨‍💼 *ATENCIÓN AL CLIENTE...*";
    } 
    
    // 2. Manejo de Categorías
    else if (texto === 'a' || texto === 'b' || texto === 'c') {
        // ... (contenido de A, B, C igual)
        return `📝 *SOLICITUD DE REGISTRO...*`;
    }

    // 3. NUEVO: Si no es ninguna opción, asumimos que es el nombre enviado para registro
    else {
        return (
            "✅ *¡Datos recibidos correctamente!*\n\n" +
            `Hemos registrado el nombre: *${texto.toUpperCase()}*.\n\n` +
            "El equipo administrativo ya ha recibido tu solicitud. En breve nos pondremos en contacto contigo por este mismo chat para enviarte el QR oficial y formalizar tu ingreso al equipo de 10 miembros.\n\n" +
            "💡 _Escribe *Inicio* para ver el menú principal._"
        );
    }
}
// ... (resto del código igual)
