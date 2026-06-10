# Product

## Register

product

## Users
Participantes de una quiniela privada del Mundial 2026: un grupo de conocidos (compañeros de trabajo, amigos y familia) en México, mayormente en móvil, que entran unos minutos al día para capturar sus pronósticos L/E/V antes del cierre de cada jornada y para revisar el ranking después de los partidos. Un único administrador valida pagos por WhatsApp, captura marcadores y gestiona usuarios desde el mismo sitio, normalmente con prisa y durante el torneo en curso. El trabajo a realizar: "no quedarme fuera de la jornada" y "saber cómo voy contra los demás".

## Product Purpose
Administrar una quiniela mundialista de principio a fin sin hojas de cálculo ni capturas en chats: registro, activación tras pago validado manualmente, pronósticos por jornada con cierre automático (23:59 del día anterior, hora de Ciudad de México), captura de resultados oficiales y un ranking público compartible por WhatsApp. El éxito es que las ~decenas de participantes capturen a tiempo cada jornada sin fricción, que nadie dispute los puntos (todo es derivado y auditable) y que el ranking se comparta solo.

## Brand Personality
Arena digital de alto voltaje: competitiva, precisa, eléctrica. La estética "Cyber-Stadium" (retro-futurismo + glassmorphism, ver DESIGN.md) hace que cada pronóstico se sienta como un evento de alta tecnología, pero la voz en texto es clara y directa en español — la emoción la pone el visual, no la copy. Tono cercano de quiniela entre conocidos, nunca corporativo ni infantil.

## Anti-references
- Dashboards admin genéricos tipo Bootstrap/plantilla: tablas grises, azul corporativo, cero personalidad.
- Sitios de apuestas reales (Bet365, Caliente): saturación de cuotas, urgencia agresiva, parpadeos; esta quiniela no maneja dinero en la app.
- Nostalgia synthwave kitsch: el retro-futurismo aquí es premium y contenido, no un poster de los 80 con scanlines por todos lados.
- Apps de resultados deportivos sobrecargadas (estadística densa, banners): V1 es solo pronósticos, resultados y ranking.

## Design Principles
- La jornada es el evento: la pantalla de pronósticos optimiza para capturar una jornada completa en menos de un minuto, con el estado (abierta/cerrada, guardada/incompleta) siempre evidente.
- La emoción no compite con la claridad: el neón y el glow señalan estado y jerarquía (acción primaria, acierto, cierre inminente), nunca decoran al azar.
- Confianza por transparencia: puntos y ranking siempre muestran de dónde salen (pronóstico vs resultado oficial); nada parece editado a mano.
- Móvil primero, pulgar primero: capturar L/E/V debe funcionar perfecto a una mano; el desktop es la vista cómoda, no la base.
- El admin también merece el estadio: el panel usa el mismo sistema visual con densidad mayor, no un tema aparte de "backoffice".

## Accessibility & Inclusion
- Texto principal en blanco de alto contraste sobre fondos oscuros, objetivo AAA para texto (ya definido en DESIGN.md); mínimo WCAG 2.1 AA en todo lo demás.
- El estado L/E/V seleccionado nunca se comunica solo con color: siempre acompañado de forma/marca (relevante para daltonismo, frecuente en audiencia masculina).
- Targets táctiles mínimos de 44px para la captura de pronósticos en móvil.
- Glassmorphism y glows respetan `prefers-reduced-motion` y mantienen legibilidad del texto sobre superficies translúcidas.
- UI íntegramente en español (es-MX); fechas y horas siempre en hora de Ciudad de México con la zona explícita.
