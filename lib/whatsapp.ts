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
