import { formatDeadline } from "@/lib/format";

/** Deep link wa.me con mensaje prellenado (decisión de producto: spec account-activation). */
export function buildWhatsappLink(
  rawNumber: string,
  user: { name: string; email: string; phone: string }
): string | null {
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;
  // Números de 10 dígitos se asumen mexicanos (+52)
  const full = digits.length === 10 ? `52${digits}` : digits;
  const text =
    `Hola, soy ${user.name}. Quiero activar mi cuenta en la Quiniela Mundialista.\n` +
    `Correo: ${user.email}\nTeléfono: ${user.phone}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/**
 * Deep link admin → usuario para recordar el pago (change recordatorio-pago-whatsapp,
 * design.md D2/D6). Dirigido al teléfono del usuario con bienvenida, monto y datos
 * de transferencia prellenados. Devuelve null si falta el teléfono o cualquier dato
 * de transferencia: el botón usa ese null para deshabilitarse.
 */
export function buildPaymentReminderLink(
  userPhone: string,
  user: { name: string },
  bank: { bankName: string; clabe: string; holder: string; amount: string }
): string | null {
  const digits = userPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (!bank.bankName || !bank.clabe || !bank.holder || !bank.amount) return null;

  // Números de 10 dígitos se asumen mexicanos (+52)
  const full = digits.length === 10 ? `52${digits}` : digits;
  const text =
    `¡Hola ${user.name}! 🏆 Te damos la bienvenida a la Quiniela Mundialista.\n` +
    `Para activar tu cuenta realiza tu pago de $${bank.amount} por transferencia:\n` +
    `• Banco: ${bank.bankName}\n` +
    `• CLABE: ${bank.clabe}\n` +
    `• A nombre de: ${bank.holder}\n` +
    `Cuando transfieras, mándame tu comprobante por aquí y activo tu cuenta. ¡Suerte! ⚽`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/**
 * Deep link admin → usuario para recordar el arranque de la fase de eliminatoria
 * (botón en /admin/usuarios). Dirigido al teléfono del usuario con aviso de inicio,
 * la regla de cierre (kickoff − 1h) y el próximo partido prellenados. Reutiliza la
 * normalización `52` + 10 dígitos de los otros enlaces. Devuelve null si falta el
 * teléfono o no hay un próximo partido de eliminatoria abierto: el botón usa ese
 * null para deshabilitarse.
 */
export function buildEliminatoriaReminderLink(
  userPhone: string,
  user: { name: string },
  nextMatch: { home: string; away: string; kickoffAt: string } | null
): string | null {
  const digits = userPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (!nextMatch) return null;

  // Números de 10 dígitos se asumen mexicanos (+52)
  const full = digits.length === 10 ? `52${digits}` : digits;
  const text =
    `¡Hola ${user.name}! ⚽ En unas horas arranca la fase de Eliminatoria de la Quiniela Mundialista.\n` +
    `No olvides poner tu pronóstico: puedes hacerlo hasta una hora antes del inicio de cada partido.\n` +
    `Próximo partido: ${nextMatch.home} vs ${nextMatch.away}, cierra el ${formatDeadline(nextMatch.kickoffAt)}.\n` +
    `Entra aquí para pronosticar: https://www.quinielamundialistas.com/partidos\n` +
    `¡Mucha suerte! 🏆`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
